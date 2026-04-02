from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete, and_, or_, func, text
from uuid import UUID
from datetime import datetime, date, time

from models.trainings import TrainingSession, Room, Class, SessionStatus
from models.equipments import Equipment, EquipmentStatus
from models.payments import Payment
from models.users.admin_staff import AdminStaff
from models.users.user import User, UserRole
from core.encryption import PasswordManager


class AdminStaffService:

    @staticmethod
    async def book_room_for_session(
        db: AsyncSession,
        session_id: UUID,
        room_id: UUID,
        check_conflicts: bool = True,
    ) -> Optional[TrainingSession]:
        session = (
            await db.execute(select(TrainingSession).where(TrainingSession.id == session_id))
        ).scalar_one_or_none()
        if not session:
            return None

        if check_conflicts:
            conflict_q = select(TrainingSession).where(
                TrainingSession.room_id == room_id,
                TrainingSession.session_date == session.session_date,
                TrainingSession.status == SessionStatus.scheduled,
                TrainingSession.id != session_id,
                or_(
                    and_(TrainingSession.start_time <= session.start_time, TrainingSession.end_time > session.start_time),
                    and_(TrainingSession.start_time < session.end_time, TrainingSession.end_time >= session.end_time),
                    and_(TrainingSession.start_time >= session.start_time, TrainingSession.end_time <= session.end_time),
                ),
            )
            if (await db.execute(conflict_q)).scalars().first():
                raise ValueError(f"Room {room_id} is already booked during this time slot")

        result = await db.execute(
            update(TrainingSession)
            .where(TrainingSession.id == session_id)
            .values(room_id=room_id)
            .returning(TrainingSession)
        )
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def schedule_class_with_room(
        db: AsyncSession,
        class_name: str,
        trainer_id: UUID,
        room_id: UUID,
        class_date: date,
        start_time: time,
        end_time: time,
    ) -> Class:
        conflict_q = select(Class).where(
            Class.room_id == room_id,
            Class.class_date == class_date,
            or_(
                and_(Class.start_time <= start_time, Class.end_time > start_time),
                and_(Class.start_time < end_time, Class.end_time >= end_time),
                and_(Class.start_time >= start_time, Class.end_time <= end_time),
            ),
        )
        if (await db.execute(conflict_q)).scalars().first():
            raise ValueError(f"Room {room_id} is already booked during this time slot")

        obj = Class(
            name=class_name,
            trainer_id=trainer_id,
            room_id=room_id,
            class_date=class_date,
            start_time=start_time,
            end_time=end_time,
        )
        db.add(obj)
        await db.commit()
        await db.refresh(obj)
        return obj

    @staticmethod
    async def update_equipment_maintenance(
        db: AsyncSession,
        equipment_id: UUID,
        status: EquipmentStatus = EquipmentStatus.under_repair,
        notes: Optional[str] = None,
    ) -> Optional[Equipment]:
        values: dict = {"status": status, "updated_at": datetime.utcnow()}
        if notes is not None:
            values["maintenance_notes"] = notes
        result = await db.execute(
            update(Equipment)
            .where(Equipment.id == equipment_id)
            .values(**values)
            .returning(Equipment)
        )
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def list_equipments(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
    ) -> Tuple[List[Equipment], int]:
        base_q = select(Equipment)
        count_q = select(func.count(Equipment.id))
        if status:
            try:
                status_enum = EquipmentStatus(status)
                base_q = base_q.where(Equipment.status == status_enum)
                count_q = count_q.where(Equipment.status == status_enum)
            except ValueError:
                pass
        total = (await db.execute(count_q)).scalar()
        items = (await db.execute(base_q.offset(skip).limit(limit))).scalars().all()
        return items, total

    @staticmethod
    async def list_sessions(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
        member_id: Optional[UUID] = None,
        trainer_id: Optional[UUID] = None,
        status_filter: Optional[str] = None,
    ) -> Tuple[List[TrainingSession], int]:
        conditions = []
        if member_id:
            conditions.append(TrainingSession.member_id == member_id)
        if trainer_id:
            conditions.append(TrainingSession.trainer_id == trainer_id)
        if status_filter:
            try:
                conditions.append(TrainingSession.status == SessionStatus(status_filter))
            except ValueError:
                pass

        base_q = select(TrainingSession)
        count_q = select(func.count(TrainingSession.id))
        if conditions:
            base_q = base_q.where(and_(*conditions))
            count_q = count_q.where(and_(*conditions))

        total = (await db.execute(count_q)).scalar()
        items = (
            await db.execute(
                base_q.order_by(TrainingSession.session_date.desc()).offset(skip).limit(limit)
            )
        ).scalars().all()
        return items, total

    @staticmethod
    async def list_payments(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
        member_id: Optional[UUID] = None,
        subscription_id: Optional[UUID] = None,
        status_filter: Optional[str] = None,
    ) -> Tuple[List[Payment], int]:
        conditions = []
        if member_id:
            conditions.append(Payment.member_id == member_id)
        if subscription_id:
            conditions.append(Payment.subscription_id == subscription_id)
        if status_filter:
            conditions.append(Payment.status == status_filter)

        base_q = select(Payment)
        count_q = select(func.count(Payment.id))
        if conditions:
            base_q = base_q.where(and_(*conditions))
            count_q = count_q.where(and_(*conditions))

        total = (await db.execute(count_q)).scalar()
        items = (
            await db.execute(base_q.order_by(Payment.paid_at.desc()).offset(skip).limit(limit))
        ).scalars().all()
        return items, total

    @staticmethod
    async def get_equipment_with_view(
        db: AsyncSession,
        status_filter: Optional[str] = None,
    ) -> list:
        sql = """
            SELECT equipment_id, equipment_name, status, maintenance_notes,
                   updated_at, room_name, room_capacity, maintenance_status
            FROM equipment_maintenance_view
        """
        params: dict = {}
        if status_filter:
            sql += " WHERE status = :status_filter"
            params["status_filter"] = status_filter
        sql += " ORDER BY maintenance_status, room_name, equipment_name"

        rows = (await db.execute(text(sql), params)).fetchall()
        return [
            {
                "equipment_id": str(row.equipment_id),
                "equipment_name": row.equipment_name,
                "status": row.status,
                "maintenance_notes": row.maintenance_notes,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None,
                "room_name": row.room_name,
                "room_capacity": row.room_capacity,
                "maintenance_status": row.maintenance_status,
            }
            for row in rows
        ]

    @staticmethod
    async def create_admin(
        db: AsyncSession,
        email: str,
        password: str,
        full_name: str,
    ) -> AdminStaff:
        hashed = await PasswordManager.hash_password(password)
        new_user = User(email=email, password=hashed, role=UserRole.admin)
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        new_admin = AdminStaff(id=new_user.id, full_name=full_name)
        db.add(new_admin)
        await db.commit()
        await db.refresh(new_admin)
        return new_admin
