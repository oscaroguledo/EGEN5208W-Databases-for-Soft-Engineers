from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from uuid import UUID
from datetime import datetime

from core.encryption import PasswordManager
from models.users.user import User, UserRole

class UserService:
    """
    Service layer for managing User operations
    """

    @staticmethod
    async def get_user(db: AsyncSession, user_id: UUID) -> Optional[User]:
        """
        Fetch a single user by ID
        """
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def list_users(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        role: Optional[str] = None
    ) -> List[User]:
        """
        List users with optional role filter and pagination
        """
        query = select(User)
        if role:
            query = query.where(User.role == role)
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def create_user(
        db: AsyncSession,
        email: str,
        password: str,
        role: UserRole = UserRole.member
    ) -> User:
        """
        Create a new user
        """
        hashed_password = await PasswordManager.hash_password(password)

        new_user = User(
            email=email,
            password=hashed_password,
            role=role,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        return new_user

    @staticmethod
    async def update_user(db: AsyncSession, user_id: UUID, **data) -> Optional[User]:
        """
        Update user fields
        """
        if "password" in data:
            # Hash the new password
            data["password"] = await PasswordManager.hash_password(data["password"])

        query = (
            update(User)
            .where(User.id == user_id)
            .values(**data, updated_at=datetime.utcnow())
            .returning(User)
        )
        result = await db.execute(query)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def delete_user(db: AsyncSession, user_id: UUID) -> bool:
        """
        Permanently delete a user
        """
        result = await db.execute(delete(User).where(User.id == user_id))
        await db.commit()
        return result.rowcount > 0

    @staticmethod
    async def verify_password(db: AsyncSession, user_id: UUID, password: str) -> bool:
        """
        Verify the password for a user
        """
        user = await UserService.get_user(db, user_id)
        if not user:
            return False
        return await PasswordManager.verify_password(password, user.password)