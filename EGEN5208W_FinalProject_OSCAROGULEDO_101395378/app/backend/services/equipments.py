from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete, func
from uuid import UUID
from datetime import datetime

from models.equipments import Equipment, EquipmentStatus


class EquipmentService:

    @staticmethod
    async def get_equipment(db: AsyncSession, equipment_id: UUID) -> Optional[Equipment]:
        result = await db.execute(select(Equipment).where(Equipment.id == equipment_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def list_equipments(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        status: Optional[EquipmentStatus] = None,
        room_id: Optional[UUID] = None,
    ) -> Tuple[List[Equipment], int]:
        count_q = select(func.count(Equipment.id))
        data_q = select(Equipment)
        if status:
            count_q = count_q.where(Equipment.status == status)
            data_q = data_q.where(Equipment.status == status)
        if room_id:
            count_q = count_q.where(Equipment.room_id == room_id)
            data_q = data_q.where(Equipment.room_id == room_id)
        total = (await db.execute(count_q)).scalar()
        items = (await db.execute(data_q.offset(skip).limit(limit))).scalars().all()
        return items, total

    @staticmethod
    async def create_equipment(
        db: AsyncSession,
        room_id: UUID,
        equipment_name: str,
        status: EquipmentStatus = EquipmentStatus.operational,
    ) -> Equipment:
        obj = Equipment(room_id=room_id, equipment_name=equipment_name, status=status)
        db.add(obj)
        await db.commit()
        await db.refresh(obj)
        return obj

    @staticmethod
    async def update_equipment(db: AsyncSession, equipment_id: UUID, **data) -> Optional[Equipment]:
        result = await db.execute(
            update(Equipment)
            .where(Equipment.id == equipment_id)
            .values(**data, updated_at=datetime.utcnow())
            .returning(Equipment)
        )
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def soft_delete_equipment(db: AsyncSession, equipment_id: UUID) -> bool:
        # No deleted_at column — hard delete
        result = await db.execute(delete(Equipment).where(Equipment.id == equipment_id))
        await db.commit()
        return result.rowcount > 0
