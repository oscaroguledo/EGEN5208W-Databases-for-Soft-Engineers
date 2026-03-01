from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from uuid import UUID
from datetime import datetime

from core.encryption import PasswordManager
from models.users.user import User, UserRole
from models.members.member import Member

class MemberService:
    """
    Service layer for managing Member operations
    """

    @staticmethod
    async def get_member(db: AsyncSession, member_id: UUID) -> Optional[Member]:
        """
        Fetch a single member by ID (only non-deleted)
        """
        result = await db.execute(
            select(Member).where(Member.id == member_id, Member.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_members(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        gender: Optional[str] = None
    ) -> List[Member]:
        """
        List members with optional gender filter and pagination
        """
        query = select(Member).where(Member.deleted_at.is_(None))
        if gender:
            query = query.where(Member.gender == gender)
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def create_member(
        db: AsyncSession,
        email: str,
        password: str,
        full_name: str,
        date_of_birth: datetime,
        gender: str,
        phone: str
    ) -> Member:
        """
        Create a new member and linked User account
        """
        # 1️⃣ Hash the password
        hashed_password = await PasswordManager.hash_password(password)

        # 2️⃣ Create the User first
        new_user = User(
            email=email,
            password=hashed_password,
            role=UserRole.member
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        # 3️⃣ Create the Member profile
        new_member = Member(
            id=new_user.id,  # same UUID as User
            full_name=full_name,
            date_of_birth=date_of_birth,
            gender=gender,
            phone=phone,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(new_member)
        await db.commit()
        await db.refresh(new_member)

        return new_member

    @staticmethod
    async def update_member(db: AsyncSession, member_id: UUID, **data) -> Optional[Member]:
        """
        Update member fields (non-deleted)
        """
        query = (
            update(Member)
            .where(Member.id == member_id, Member.deleted_at.is_(None))
            .values(**data, updated_at=datetime.utcnow())
            .returning(Member)
        )
        result = await db.execute(query)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def soft_delete_member(db: AsyncSession, member_id: UUID) -> bool:
        """
        Marks a member as deleted (soft delete)
        """
        result = await db.execute(
            update(Member)
            .where(Member.id == member_id, Member.deleted_at.is_(None))
            .values(deleted_at=datetime.utcnow())
        )
        await db.commit()
        return result.rowcount > 0

    @staticmethod
    async def hard_delete_member(db: AsyncSession, member_id: UUID) -> bool:
        """
        Permanently delete a member (hard delete)
        """
        result = await db.execute(delete(Member).where(Member.id == member_id))
        await db.commit()
        return result.rowcount > 0

    @staticmethod
    async def verify_member_password(db: AsyncSession, member_id: UUID, password: str) -> bool:
        """
        Verify member's password
        """
        result = await db.execute(select(Member).where(Member.id == member_id))
        member = result.scalar_one_or_none()
        if not member or not member.user:
            return False
        return await PasswordManager.verify_password(password, member.user.password)