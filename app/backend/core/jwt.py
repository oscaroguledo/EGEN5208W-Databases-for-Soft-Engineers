"""
JWT token creation and verification.
Uses python-jose with HS256 signing.

Token types:
  - access  : short-lived (ACCESS_TOKEN_EXPIRE_MINUTES), sent on every request
  - refresh : long-lived  (REFRESH_TOKEN_EXPIRE_DAYS),   used only to get a new access token
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, status

from core.config import settings

# How long each token type lives
ACCESS_TOKEN_EXPIRE_MINUTES: int = settings.ACCESS_TOKEN_EXPIRE_MINUTES  # default 30
REFRESH_TOKEN_EXPIRE_DAYS: int = 7


def _now() -> datetime:
    return datetime.utcnow()


def create_access_token(
    user_id: str,
    email: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a signed JWT access token.
    Claims: sub (user_id), email, role, type='access', iat, exp
    """
    expire = _now() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "type": "access",
        "iat": _now(),
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(
    user_id: str,
    email: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a signed JWT refresh token.
    Claims: sub (user_id), email, role, type='refresh', iat, exp
    """
    expire = _now() + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "type": "refresh",
        "iat": _now(),
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    """
    Decode and verify a JWT token.
    Raises HTTP 401 on any failure (expired, invalid signature, malformed).
    Returns the full payload dict on success.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or has expired. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def decode_access_token(token: str) -> dict:
    """Decode and verify an access token specifically."""
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Expected access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def decode_refresh_token(token: str) -> dict:
    """Decode and verify a refresh token specifically."""
    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Expected refresh token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload
