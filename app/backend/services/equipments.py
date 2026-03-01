from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from uuid import UUID
from datetime import datetime

from models.equipments import Equipment, EquipmentStatus

class EquipmentService:
    """
    Service layer for managing Equipment operations
    """

    @staticmethod
    async def get_equipment(db: AsyncSession, equipment_id: UUID) -> Optional[Equipment]:
        """
        Fetch a single equipment by ID
        """
        result = await db.execute(
            select(Equipment).where(Equipment.id == equipment_id, Equipment.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_equipments(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        status: Optional[EquipmentStatus] = None,
        room_id: Optional[UUID] = None
    ) -> List[Equipment]:
        """
        List equipments with optional filtering by status and room
        """
        query = select(Equipment).where(Equipment.deleted_at.is_(None))
        if status:
            query = query.where(Equipment.status == status)
        if room_id:
            query = query.where(Equipment.room_id == room_id)
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def create_equipment(
        db: AsyncSession,
        room_id: UUID,
        equipment_name: str,
        status: EquipmentStatus = EquipmentStatus.operational
    ) -> Equipment:
        """
        Create a new equipment
        """
        new_equipment = Equipment(
            room_id=room_id,
            equipment_name=equipment_name,
            status=status,
            created_at=datetime.utcnow()
        )
        db.add(new_equipment)
        await db.commit()
        await db.refresh(new_equipment)
        return new_equipment

    @staticmethod
    async def update_equipment(db: AsyncSession, equipment_id: UUID, **data) -> Optional[Equipment]:
        """
        Update equipment fields
        """
        query = (
            update(Equipment)
            .where(Equipment.id == equipment_id, Equipment.deleted_at.is_(None))
            .values(**data)
            .returning(Equipment)
        )
        result = await db.execute(query)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def soft_delete_equipment(db: AsyncSession, equipment_id: UUID) -> bool:
        """
        Soft-delete an equipment (mark deleted_at)
        """
        result = await db.execute(
            update(Equipment)
            .where(Equipment.id == equipment_id, Equipment.deleted_at.is_(None))
            .values(deleted_at=datetime.utcnow())
        )
        await db.commit()
        return result.rowcount > 0

    @staticmethod
    async def hard_delete_equipment(db: AsyncSession, equipment_id: UUID) -> bool:
        """
        Permanently delete an equipment
        """
        result = await db.execute(delete(Equipment).where(Equipment.id == equipment_id))
        await db.commit()
        return result.rowcount > 0