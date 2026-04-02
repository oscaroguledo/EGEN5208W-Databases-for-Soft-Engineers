from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
import uuid

from core.db import get_db
from core.response import APIResponse
from core.sessions import (
    create_user_session, 
    get_session, 
    delete_session,
    delete_all_user_sessions,
    extend_session,
    session_store,
    blacklist_token,
    is_token_blacklisted
)
from services.users.user import UserService
from models.users.user import User, UserRole

router = APIRouter(prefix="/auth", tags=["authentication"])

# Security scheme for session-based auth
security = HTTPBearer(auto_error=False)


# Session validation dependencies
async def get_current_user_from_session(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get current user from session token.
    Validates session and returns user object.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a session token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    session = await get_session(credentials.credentials)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    user = await UserService.get_user(db, uuid.UUID(session.user_id))
    if not user:
        # User no longer exists, clear session
        await delete_session(session.id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found. Session cleared.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_optional_user_from_session(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Dependency to optionally get current user from session.
    Returns None if no valid session.
    """
    if not credentials:
        return None
    
    session = await get_session(credentials.credentials)
    if not session:
        return None
    
    user = await UserService.get_user(db, uuid.UUID(session.user_id))
    return user

@router.post("/login", response_model=APIResponse[dict])
async def login(
    email: str,
    password: str,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate user and create session"""
    try:
        # Authenticate user
        user = await UserService.authenticate_user(db, email, password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Create production-ready session with TTL
        session = await create_user_session(
            user_id=str(user.id),
            email=user.email,
            role=user.role.value,
            ttl_minutes=30,  # 30 minute session
            extra_data={
                "full_name": getattr(user, 'full_name', email),
                "login_time": datetime.utcnow().isoformat()
            }
        )
        
        return APIResponse.success({
            "session_id": session.id,
            "expires_at": session.expires_at.isoformat(),
            "user": {
                "id": str(user.id),
                "email": user.email,
                "role": user.role.value,
                "full_name": getattr(user, 'full_name', email)
            }
        })
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/logout", response_model=APIResponse[dict])
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Logout user and clear session - Production implementation"""
    if not credentials:
        return APIResponse.success({
            "message": "No active session found"
        })
    
    session_id = credentials.credentials
    session = await get_session(session_id)
    
    if session:
        # Clear the session from store
        deleted = await delete_session(session_id)
        if deleted:
            return APIResponse.success({
                "message": "Logged out successfully",
                "session_cleared": True,
                "user_id": session.user_id
            })
    
    return APIResponse.success({
        "message": "Session already expired or invalid",
        "session_cleared": False
    })

@router.post("/logout-token", response_model=APIResponse[dict])
async def logout_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Logout user and clear session (alias for /logout)"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No session token provided"
        )
    
    session_id = credentials.credentials
    deleted = await delete_session(session_id)
    
    return APIResponse.success({
        "message": "Successfully logged out" if deleted else "Session already expired",
        "session_cleared": deleted
    })

@router.post("/refresh", response_model=APIResponse[dict])
async def refresh_session_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Refresh session expiration time"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No session token provided"
        )
    
    session = await extend_session(credentials.credentials, ttl_minutes=30)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please login again."
        )
    
    return APIResponse.success({
        "message": "Session refreshed successfully",
        "session_id": session.id,
        "new_expires_at": session.expires_at.isoformat()
    })

@router.post("/logout-all", response_model=APIResponse[dict])
async def logout_all_sessions(
    current_user: User = Depends(get_current_user_from_session)
):
    """Logout from all devices/sessions for current user"""
    deleted_count = await delete_all_user_sessions(str(current_user.id))
    
    return APIResponse.success({
        "message": f"Logged out from all {deleted_count} active session(s)",
        "sessions_cleared": deleted_count
    })

@router.get("/me", response_model=APIResponse[dict])
async def get_current_user_info(
    current_user: User = Depends(get_current_user_from_session)
):
    """Get current user information from valid session"""
    return APIResponse.success({
        "id": str(current_user.id),
        "email": current_user.email,
        "role": current_user.role.value,
        "full_name": getattr(current_user, 'full_name', current_user.email)
    })

@router.get("/verify", response_model=APIResponse[dict])
async def verify_session_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Verify if session is valid and get session info"""
    if not credentials:
        return APIResponse.success({
            "valid": False,
            "message": "No session token provided"
        })
    
    session = await get_session(credentials.credentials)
    
    if not session:
        return APIResponse.success({
            "valid": False,
            "message": "Session is invalid or expired"
        })
    
    return APIResponse.success({
        "valid": True,
        "session": session.to_dict()
    })
