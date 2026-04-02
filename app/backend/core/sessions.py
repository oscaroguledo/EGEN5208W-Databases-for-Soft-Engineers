"""
JWT token blacklist.

When a user logs out we add their token's JTI (or the raw token) to this
in-memory set so it cannot be reused even before it expires.

For multi-process / multi-server deployments swap this out for Redis.
"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, Optional


class TokenBlacklist:
    """
    In-memory blacklist keyed by token string → expiry datetime.
    A background task prunes expired entries every 10 minutes.
    """

    def __init__(self, cleanup_interval_minutes: int = 10):
        self._blacklist: Dict[str, datetime] = {}
        self._lock = asyncio.Lock()
        self._cleanup_interval = timedelta(minutes=cleanup_interval_minutes)
        self._cleanup_task: Optional[asyncio.Task] = None

    # ── lifecycle ──────────────────────────────────────────────────────────

    async def start_cleanup_task(self) -> None:
        if self._cleanup_task is None or self._cleanup_task.done():
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())

    async def stop_cleanup_task(self) -> None:
        if self._cleanup_task and not self._cleanup_task.done():
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass

    async def _cleanup_loop(self) -> None:
        while True:
            try:
                await asyncio.sleep(self._cleanup_interval.total_seconds())
                await self._prune()
            except asyncio.CancelledError:
                break
            except Exception:
                pass

    async def _prune(self) -> None:
        now = datetime.utcnow()
        async with self._lock:
            expired = [t for t, exp in self._blacklist.items() if now > exp]
            for t in expired:
                del self._blacklist[t]

    # ── public API ─────────────────────────────────────────────────────────

    async def add(self, token: str, expires_at: datetime) -> None:
        """Blacklist a token until its natural expiry."""
        async with self._lock:
            self._blacklist[token] = expires_at

    async def is_blacklisted(self, token: str) -> bool:
        """Return True if the token has been revoked."""
        async with self._lock:
            exp = self._blacklist.get(token)
            if exp is None:
                return False
            if datetime.utcnow() > exp:
                del self._blacklist[token]
                return False
            return True


# ── module-level singleton ─────────────────────────────────────────────────
token_blacklist = TokenBlacklist()
