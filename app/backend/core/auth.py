"""
Authentication & authorisation helpers.

All protected routes depend on one of the RoleChecker instances at the bottom
of this file (require_member, require_trainer, require_admin, …).

Flow:
  1. Client sends  Authorization: Bearer <access_token>
  2. HTTPBearer extracts the raw token string
  3. RoleChecker.__call__ decodes + verifies the JWT
  4. Checks the token is not blacklisted (logout revocation)
  5. Loads the User row from the DB
  6. Asserts the user's role is in the allowed set
  7. Returns the User object to the route handler
"""

from typing import Optional
from uuid import UUID
import uuid as _uuid

from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext

from core.db import get_db
from core.jwt import decode_access_token
from core.sessions import token_blacklist
from models.users.user import User, UserRole
from services.users.user import UserService

# ── password hashing ───────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

security = HTTPBearer(auto_error=False)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# ── core JWT → User resolution ─────────────────────────────────────────────

async def get_user_from_jwt(
    credentials: Optional[HTTPAuthorizationCredentials],
    db: AsyncSession,
    required_roles: list[UserRole],
) -> User:
    """
    Shared logic used by every RoleChecker:
      - validates Bearer token presence
      - decodes + verifies JWT signature / expiry
      - checks token is not blacklisted
      - loads User from DB
      - enforces role
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # Decode & verify signature / expiry
    payload = decode_access_token(token)

    # Revocation check (logout blacklist)
    if await token_blacklist.is_blacklisted(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Load user from DB (ensures account still exists / not deleted)
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token: missing subject.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await UserService.get_user(db, _uuid.UUID(user_id_str))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Role enforcement
    if user.role not in required_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Required role(s): {[r.value for r in required_roles]}",
        )

    return user


# ── RoleChecker dependency ─────────────────────────────────────────────────

class RoleChecker:
    """FastAPI dependency that validates a JWT and enforces role membership."""

    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles

    async def __call__(
        self,
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        return await get_user_from_jwt(credentials, db, self.allowed_roles)


# ── pre-built role checkers (import these in route files) ──────────────────
require_member          = RoleChecker([UserRole.member])
require_trainer         = RoleChecker([UserRole.trainer])
require_admin           = RoleChecker([UserRole.admin])
require_trainer_or_admin = RoleChecker([UserRole.trainer, UserRole.admin])
require_member_or_trainer = RoleChecker([UserRole.member, UserRole.trainer])
require_any_role        = RoleChecker([UserRole.member, UserRole.trainer, UserRole.admin])


# ── PermissionChecker (fine-grained, used inside route handlers) ───────────

class PermissionChecker:

    @staticmethod
    async def can_access_member_data(
        current_user: User,
        target_member_id: UUID,
        db: AsyncSession,
    ) -> bool:
        if current_user.role == UserRole.member:
            return current_user.id == target_member_id
        if current_user.role == UserRole.admin:
            return True
        if current_user.role == UserRole.trainer:
            from sqlalchemy import select, exists
            from models.trainings import TrainingSession, Class, Enrollment

            q = select(exists().where(
                (TrainingSession.trainer_id == current_user.id) &
                (TrainingSession.member_id == target_member_id)
            ))
            if (await db.execute(q)).scalar():
                return True

            q2 = select(exists().where(
                (Class.trainer_id == current_user.id) &
                (Enrollment.class_id == Class.id) &
                (Enrollment.member_id == target_member_id)
            ))
            return (await db.execute(q2)).scalar()
        return False

    @staticmethod
    async def can_access_trainer_data(
        current_user: User,
        target_trainer_id: UUID,
        db: AsyncSession,
    ) -> bool:
        if current_user.role == UserRole.trainer:
            return current_user.id == target_trainer_id
        if current_user.role == UserRole.admin:
            return True
        if current_user.role == UserRole.member:
            from sqlalchemy import select, exists
            from models.trainings import TrainingSession

            q = select(exists().where(
                (TrainingSession.member_id == current_user.id) &
                (TrainingSession.trainer_id == target_trainer_id)
            ))
            return (await db.execute(q)).scalar()
        return False

    @staticmethod
    def can_manage_schedules(current_user: User) -> bool:
        return current_user.role in [UserRole.trainer, UserRole.admin]

    @staticmethod
    def can_manage_billing(current_user: User) -> bool:
        return current_user.role == UserRole.admin

    @staticmethod
    async def can_view_health_metrics(
        current_user: User,
        member_id: Optional[UUID] = None,
        db: AsyncSession = None,
    ) -> bool:
        if current_user.role == UserRole.member:
            return member_id is None or current_user.id == member_id
        if current_user.role == UserRole.admin:
            return True
        if current_user.role == UserRole.trainer:
            if db is not None and member_id is not None:
                from sqlalchemy import select, exists
                from models.trainings import TrainingSession

                q = select(exists().where(
                    (TrainingSession.trainer_id == current_user.id) &
                    (TrainingSession.member_id == member_id)
                ))
                return (await db.execute(q)).scalar()
            return True  # trainer can see their own list (filtered elsewhere)
        return False


# ── tiny helpers ───────────────────────────────────────────────────────────
def is_admin(u: User) -> bool:   return u.role == UserRole.admin
def is_trainer(u: User) -> bool: return u.role == UserRole.trainer
def is_member(u: User) -> bool:  return u.role == UserRole.member
