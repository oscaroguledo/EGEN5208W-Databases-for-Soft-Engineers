"""
Authentication routes.

POST /auth/login        → returns access_token + refresh_token
POST /auth/logout       → blacklists the current access token
POST /auth/refresh      → exchanges a valid refresh token for a new access token
POST /auth/logout-all   → blacklists the current access token (stateless: can't
                          revoke all devices without a DB; blacklists current one)
GET  /auth/me           → returns user info from the JWT (no DB hit needed)
GET  /auth/verify       → returns whether the supplied token is valid
"""

from datetime import datetime
from typing import Optional
import uuid as _uuid

from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_db
from core.response import APIResponse
from core.jwt import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from core.sessions import token_blacklist
from core.auth import get_user_from_jwt, security
from services.users.user import UserService
from models.users.user import User, UserRole

router = APIRouter(prefix="/auth", tags=["authentication"])


# ── request / response schemas ─────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


# ── helpers ────────────────────────────────────────────────────────────────

def _user_dict(user: User) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "role": user.role.value,
        "full_name": getattr(user, "full_name", user.email),
    }


# ── routes ─────────────────────────────────────────────────────────────────

@router.post("/login", response_model=APIResponse[dict])
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate with email + password.
    Returns a short-lived access token and a long-lived refresh token.
    """
    user = await UserService.authenticate_user(db, login_data.email, login_data.password)
    if not user:
        return APIResponse.error(
            message="Invalid email or password.",
            status_code=401
        )

    access_token  = create_access_token(str(user.id), user.email, user.role.value)
    refresh_token = create_refresh_token(str(user.id), user.email, user.role.value)

    return APIResponse.success(
        data={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # seconds
            "user": _user_dict(user),
        },
        message="Login successful.",
    )


@router.post("/logout", response_model=APIResponse[dict])
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Revoke the current access token by adding it to the blacklist.
    The client should also discard the refresh token locally.
    """
    if not credentials:
        return APIResponse.success(data={"revoked": False}, message="No token provided.")

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        exp = payload.get("exp")
        expires_at = datetime.utcfromtimestamp(exp) if exp else datetime.utcnow()
        await token_blacklist.add(token, expires_at)
    except HTTPException:
        pass  # already invalid — that's fine

    return APIResponse.success(data={"revoked": True}, message="Logged out successfully.")


@router.post("/refresh", response_model=APIResponse[dict])
async def refresh(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Exchange a valid refresh token for a new access token.
    The refresh token itself is NOT rotated (stateless design).
    If you need rotation, blacklist the old refresh token here and issue a new one.
    """
    payload = decode_refresh_token(body.refresh_token)

    user = await UserService.get_user(db, _uuid.UUID(payload["sub"]))
    if not user:
        return APIResponse.error(
            message="User account not found.",
            status_code=401
        )

    new_access_token = create_access_token(str(user.id), user.email, user.role.value)

    return APIResponse.success(
        data={
            "access_token": new_access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        },
        message="Token refreshed.",
    )

@router.get("/me", response_model=APIResponse[dict])
async def me(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """
    Return the authenticated user's profile.
    Validates the JWT and loads the user from the DB.
    """
    user = await get_user_from_jwt(credentials, db, list(UserRole))
    return APIResponse.success(data=_user_dict(user), message="User info retrieved.")


@router.get("/verify", response_model=APIResponse[dict])
async def verify(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Check whether the supplied access token is currently valid.
    Returns valid=True/False without raising an error.
    """
    if not credentials:
        return APIResponse.success(data={"valid": False}, message="No token provided.")

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        if await token_blacklist.is_blacklisted(token):
            return APIResponse.success(data={"valid": False}, message="Token has been revoked.")
        return APIResponse.success(
            data={
                "valid": True,
                "user_id": payload.get("sub"),
                "email": payload.get("email"),
                "role": payload.get("role"),
                "exp": payload.get("exp"),
            },
            message="Token is valid.",
        )
    except HTTPException:
        return APIResponse.success(data={"valid": False}, message="Token is invalid or expired.")
