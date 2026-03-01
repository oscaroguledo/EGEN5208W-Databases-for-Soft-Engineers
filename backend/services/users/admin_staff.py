from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from uuid import UUID
from datetime import datetime

from models.users.admin_staff import AdminStaff
from models.users.user import User, UserRole

class AdminStaffService:
    """
    Service layer for managing AdminStaff operations
    """

    @staticmethod
    async def get_admin(db: AsyncSession, admin_id: UUID) -> Optional[AdminStaff]:
        """
        Fetch a single admin staff by ID
        """
        result = await db.execute(
            select(AdminStaff).where(AdminStaff.id == admin_id, AdminStaff.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_admins(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[AdminStaff]:
        """
        List all admin staff with pagination
        """
        query = select(AdminStaff).where(AdminStaff.deleted_at.is_(None)).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def create_admin(
        db: AsyncSession,
        email: str,
        password: str,
        full_name: str
    ) -> AdminStaff:
        """
        Create a new admin staff along with the linked User
        """
        from core.encryption import PasswordManager

        # 1️⃣ Hash the password
        hashed_password = await PasswordManager.hash_password(password)

        # 2️⃣ Create the User
        new_user = User(
            email=email,
            password=hashed_password,
            role=UserRole.admin
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        # 3️⃣ Create the AdminStaff profile
        new_admin = AdminStaff(
            id=new_user.id,
            full_name=full_name,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(new_admin)
        await db.commit()
        await db.refresh(new_admin)

        return new_admin

    @staticmethod
    async def update_admin(db: AsyncSession, admin_id: UUID, **data) -> Optional[AdminStaff]:
        """
        Update admin staff fields
        """
        query = (
            update(AdminStaff)
            .where(AdminStaff.id == admin_id, AdminStaff.deleted_at.is_(None))
            .values(**data, updated_at=datetime.utcnow())
            .returning(AdminStaff)
        )
        result = await db.execute(query)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def soft_delete_admin(db: AsyncSession, admin_id: UUID) -> bool:
        """
        Soft-delete an admin staff (mark deleted_at)
        """
        result = await db.execute(
            update(AdminStaff)
            .where(AdminStaff.id == admin_id, AdminStaff.deleted_at.is_(None))
            .values(deleted_at=datetime.utcnow())
        )
        await db.commit()
        return result.rowcount > 0

    @staticmethod
    async def hard_delete_admin(db: AsyncSession, admin_id: UUID) -> bool:
        """
        Permanently delete an admin staff
        """
        result = await db.execute(delete(AdminStaff).where(AdminStaff.id == admin_id))
        await db.commit()
        return result.rowcount > 0