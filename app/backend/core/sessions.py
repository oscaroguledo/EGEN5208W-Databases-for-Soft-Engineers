"""
Session management module for production use.
Provides secure session storage with TTL (time-to-live) and automatic cleanup.
"""

import uuid
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from dataclasses import dataclass, field


@dataclass
class Session:
    """Represents a user session"""
    id: str
    user_id: str
    email: str
    role: str
    created_at: datetime
    expires_at: datetime
    data: Dict[str, Any] = field(default_factory=dict)
    
    def is_expired(self) -> bool:
        """Check if session has expired"""
        return datetime.utcnow() > self.expires_at
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert session to dictionary for response"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat(),
        }


class SessionStore:
    """
    In-memory session store with TTL support and token blacklisting.
    For production with multiple servers, replace with Redis or database-backed store.
    """
    
    def __init__(self, default_ttl_minutes: int = 30, cleanup_interval_minutes: int = 5):
        self._sessions: Dict[str, Session] = {}
        self._blacklisted_tokens: Dict[str, datetime] = {}
        self._default_ttl = timedelta(minutes=default_ttl_minutes)
        self._cleanup_interval = timedelta(minutes=cleanup_interval_minutes)
        self._cleanup_task: Optional[asyncio.Task] = None
        self._lock = asyncio.Lock()
    
    async def start_cleanup_task(self):
        """Start background task to clean up expired sessions"""
        if self._cleanup_task is None or self._cleanup_task.done():
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())
    
    async def stop_cleanup_task(self):
        """Stop the cleanup background task"""
        if self._cleanup_task and not self._cleanup_task.done():
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
    
    async def _cleanup_loop(self):
        """Background loop to remove expired sessions and stale blacklist entries"""
        while True:
            try:
                await asyncio.sleep(self._cleanup_interval.total_seconds())
                await self._remove_expired_sessions()
                await self._cleanup_blacklist()
            except asyncio.CancelledError:
                break
            except Exception:
                # Log error but continue cleanup loop
                pass
    
    async def _remove_expired_sessions(self):
        """Remove all expired sessions"""
        async with self._lock:
            expired = [
                session_id for session_id, session in self._sessions.items()
                if session.is_expired()
            ]
            for session_id in expired:
                del self._sessions[session_id]
    
    async def create_session(
        self,
        user_id: str,
        email: str,
        role: str,
        ttl_minutes: Optional[int] = None,
        extra_data: Optional[Dict[str, Any]] = None
    ) -> Session:
        """Create a new session for a user"""
        async with self._lock:
            session_id = str(uuid.uuid4())
            now = datetime.utcnow()
            ttl = timedelta(minutes=ttl_minutes) if ttl_minutes else self._default_ttl
            
            session = Session(
                id=session_id,
                user_id=user_id,
                email=email,
                role=role,
                created_at=now,
                expires_at=now + ttl,
                data=extra_data or {}
            )
            
            self._sessions[session_id] = session
            return session
    
    async def get_session(self, session_id: str) -> Optional[Session]:
        """Get a session by ID, returns None if expired or not found"""
        async with self._lock:
            session = self._sessions.get(session_id)
            if session is None:
                return None
            
            if session.is_expired():
                del self._sessions[session_id]
                return None
            
            return session
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete a session by ID, returns True if found and deleted"""
        async with self._lock:
            if session_id in self._sessions:
                del self._sessions[session_id]
                return True
            return False
    
    async def delete_user_sessions(self, user_id: str) -> int:
        """Delete all sessions for a user, returns count of deleted sessions"""
        async with self._lock:
            to_delete = [
                session_id for session_id, session in self._sessions.items()
                if session.user_id == user_id
            ]
            for session_id in to_delete:
                del self._sessions[session_id]
            return len(to_delete)
    
    async def extend_session(self, session_id: str, ttl_minutes: Optional[int] = None) -> Optional[Session]:
        """Extend session expiration time"""
        async with self._lock:
            session = self._sessions.get(session_id)
            if session is None or session.is_expired():
                return None
            
            ttl = timedelta(minutes=ttl_minutes) if ttl_minutes else self._default_ttl
            session.expires_at = datetime.utcnow() + ttl
            return session
    
    async def get_session_count(self) -> int:
        """Get total number of active sessions"""
        async with self._lock:
            # Clean up expired sessions first
            expired = [
                session_id for session_id, session in self._sessions.items()
                if session.is_expired()
            ]
            for session_id in expired:
                del self._sessions[session_id]
            
            return len(self._sessions)
    
    async def clear_all_sessions(self) -> int:
        """Clear all sessions, returns count of cleared sessions"""
        async with self._lock:
            count = len(self._sessions)
            self._sessions.clear()
            return count

    async def _cleanup_blacklist(self):
        """Remove expired entries from token blacklist"""
        async with self._lock:
            now = datetime.utcnow()
            expired = [
                token for token, expiry in self._blacklisted_tokens.items()
                if now > expiry
            ]
            for token in expired:
                del self._blacklisted_tokens[token]

    async def blacklist_token(self, token: str, expires_at: Optional[datetime] = None) -> bool:
        """Add a token to the blacklist with optional expiration"""
        async with self._lock:
            if expires_at is None:
                expires_at = datetime.utcnow() + self._default_ttl
            self._blacklisted_tokens[token] = expires_at
            return True

    async def is_token_blacklisted(self, token: str) -> bool:
        """Check if a token is blacklisted"""
        async with self._lock:
            if token not in self._blacklisted_tokens:
                return False
            # Check if blacklist entry has expired
            if datetime.utcnow() > self._blacklisted_tokens[token]:
                del self._blacklisted_tokens[token]
                return False
            return True

    async def remove_from_blacklist(self, token: str) -> bool:
        """Remove a token from the blacklist"""
        async with self._lock:
            if token in self._blacklisted_tokens:
                del self._blacklisted_tokens[token]
                return True
            return False


# Global session store instance
session_store = SessionStore(default_ttl_minutes=30)


# Convenience functions for common operations
async def create_user_session(
    user_id: str,
    email: str,
    role: str,
    ttl_minutes: int = 30,
    extra_data: Optional[Dict[str, Any]] = None
) -> Session:
    """Create a new session for a user"""
    return await session_store.create_session(
        user_id=user_id,
        email=email,
        role=role,
        ttl_minutes=ttl_minutes,
        extra_data=extra_data
    )


async def get_session(session_id: str) -> Optional[Session]:
    """Get a valid session by ID"""
    return await session_store.get_session(session_id)


async def delete_session(session_id: str) -> bool:
    """Delete a session (logout)"""
    return await session_store.delete_session(session_id)


async def delete_all_user_sessions(user_id: str) -> int:
    """Delete all sessions for a user"""
    return await session_store.delete_user_sessions(user_id)


async def extend_session(session_id: str, ttl_minutes: int = 30) -> Optional[Session]:
    """Extend session expiration"""
    return await session_store.extend_session(session_id, ttl_minutes)


async def blacklist_token(token: str, expires_at: Optional[datetime] = None) -> bool:
    """Add a token to the blacklist"""
    return await session_store.blacklist_token(token, expires_at)


async def is_token_blacklisted(token: str) -> bool:
    """Check if a token is blacklisted"""
    return await session_store.is_token_blacklisted(token)
