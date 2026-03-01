from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from uuid import UUID
from datetime import datetime

from models.users.trainer import Trainer
from models.users.user import User, UserRole

class TrainerService:
    """
    Service layer for managing Trainer operations
    """

    @staticmethod
    async def get_trainer(db: AsyncSession, trainer_id: UUID) -> Optional[Trainer]:
        """
        Fetch a single trainer by ID
        """
        result = await db.execute(
            select(Trainer).where(Trainer.id == trainer_id, Trainer.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_trainers(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[Trainer]:
        """
        List all trainers with pagination
        """
        query = select(Trainer).where(Trainer.deleted_at.is_(None)).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def create_trainer(
        db: AsyncSession,
        email: str,
        password: str,
        full_name: str
    ) -> Trainer:
        """
        Create a new trainer along with the linked User
        """
        from core.encryption import PasswordManager

        # 1️⃣ Hash the password
        hashed_password = await PasswordManager.hash_password(password)

        # 2️⃣ Create the User
        new_user = User(
            email=email,
            password=hashed_password,
            role=UserRole.trainer
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        # 3️⃣ Create the Trainer profile
        new_trainer = Trainer(
            id=new_user.id,
            full_name=full_name,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(new_trainer)
        await db.commit()
        await db.refresh(new_trainer)

        return new_trainer

    @staticmethod
    async def update_trainer(db: AsyncSession, trainer_id: UUID, **data) -> Optional[Trainer]:
        """
        Update trainer fields
        """
        query = (
            update(Trainer)
            .where(Trainer.id == trainer_id, Trainer.deleted_at.is_(None))
            .values(**data, updated_at=datetime.utcnow())
            .returning(Trainer)
        )
        result = await db.execute(query)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def soft_delete_trainer(db: AsyncSession, trainer_id: UUID) -> bool:
        """
        Soft-delete a trainer (mark deleted_at)
        """
        result = await db.execute(
            update(Trainer)
            .where(Trainer.id == trainer_id, Trainer.deleted_at.is_(None))
            .values(deleted_at=datetime.utcnow())
        )
        await db.commit()
        return result.rowcount > 0

    @staticmethod
    async def hard_delete_trainer(db: AsyncSession, trainer_id: UUID) -> bool:
        """
        Permanently delete a trainer
        """
        result = await db.execute(delete(Trainer).where(Trainer.id == trainer_id))
        await db.commit()
        return result.rowcount > 0