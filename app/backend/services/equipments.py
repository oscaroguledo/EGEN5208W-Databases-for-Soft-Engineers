from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete, func
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
    ) -> Tuple[List[Equipment], int]:
        """
        List equipments with optional filtering by status and room.
        Returns tuple of (equipment_list, total_count) for pagination.
        """
        # Build base query for counting total
        count_query = select(func.count(Equipment.id)).where(Equipment.deleted_at.is_(None))
        if status:
            count_query = count_query.where(Equipment.status == status)
        if room_id:
            count_query = count_query.where(Equipment.room_id == room_id)
        
        # Execute count query
        count_result = await db.execute(count_query)
        total = count_result.scalar()
        
        # Build data query with pagination
        data_query = select(Equipment).where(Equipment.deleted_at.is_(None))
        if status:
            data_query = data_query.where(Equipment.status == status)
        if room_id:
            data_query = data_query.where(Equipment.room_id == room_id)
        data_query = data_query.offset(skip).limit(limit)
        
        result = await db.execute(data_query)
        return result.scalars().all(), total

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