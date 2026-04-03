from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete, and_, func
from uuid import UUID
from datetime import datetime, date, time, timedelta

from models.users.trainers import Trainer
from models.users.user import User, UserRole
from models.trainings import TrainerAvailability, TrainingSession, Class, Room, SessionStatus
from core.encryption import PasswordManager


class TrainerService:

    @staticmethod
    async def set_availability(
        db: AsyncSession,
        trainer_id: UUID,
        available_date: date,
        start_at: time,
        end_at: time,
    ) -> TrainerAvailability:
        obj = TrainerAvailability(
            trainer_id=trainer_id,
            available_date=available_date,
            start_at=start_at,
            end_at=end_at,
        )
        db.add(obj)
        await db.commit()
        await db.refresh(obj)
        return obj

    @staticmethod
    async def get_trainer(db: AsyncSession, trainer_id: UUID) -> Optional[Trainer]:
        result = await db.execute(select(Trainer).where(Trainer.id == trainer_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def list_trainers(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[Trainer], int]:
        total = (await db.execute(select(func.count(Trainer.id)))).scalar()
        trainers = (
            await db.execute(select(Trainer).offset(skip).limit(limit))
        ).scalars().all()
        return trainers, total

    @staticmethod
    async def create_trainer(
        db: AsyncSession,
        email: str,
        password: str,
        full_name: str,
    ) -> Trainer:
        hashed = await PasswordManager.hash_password(password)
        new_user = User(email=email, password=hashed, role=UserRole.trainer)
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        new_trainer = Trainer(id=new_user.id, full_name=full_name)
        db.add(new_trainer)
        await db.commit()
        await db.refresh(new_trainer)
        return new_trainer

    @staticmethod
    async def update_trainer(db: AsyncSession, trainer_id: UUID, **data) -> Optional[Trainer]:
        query = (
            update(Trainer)
            .where(Trainer.id == trainer_id)
            .values(**data, updated_at=datetime.utcnow())
            .returning(Trainer)
        )
        result = await db.execute(query)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def get_schedule_view(
        db: AsyncSession,
        trainer_id: UUID,
        days_ahead: int = 7,
    ) -> dict:
        today = date.today()
        end_date = today + timedelta(days=days_ahead)

        sessions_q = (
            select(TrainingSession)
            .where(
                TrainingSession.trainer_id == trainer_id,
                TrainingSession.session_date >= today,
                TrainingSession.session_date <= end_date,
                TrainingSession.status == SessionStatus.scheduled,
            )
            .order_by(TrainingSession.session_date, TrainingSession.start_time)
        )
        classes_q = (
            select(Class)
            .where(
                Class.trainer_id == trainer_id,
                Class.class_date >= today,
                Class.class_date <= end_date,
            )
            .order_by(Class.class_date, Class.start_time)
        )
        avail_q = (
            select(TrainerAvailability)
            .where(
                TrainerAvailability.trainer_id == trainer_id,
                TrainerAvailability.available_date >= today,
                TrainerAvailability.available_date <= end_date,
            )
            .order_by(TrainerAvailability.available_date, TrainerAvailability.start_at)
        )

        sessions = (await db.execute(sessions_q)).scalars().all()
        classes = (await db.execute(classes_q)).scalars().all()
        availability = (await db.execute(avail_q)).scalars().all()

        return {
            "upcoming_sessions": [s.to_dict() for s in sessions],
            "upcoming_classes": [c.to_dict() for c in classes],
            "availability": [a.to_dict() for a in availability],
        }

    @staticmethod
    async def get_schedule_with_view(
        db: AsyncSession,
        trainer_id: UUID,
        days_ahead: int = 7,
    ) -> dict:
        from sqlalchemy import text
        end_date = date.today() + timedelta(days=days_ahead)
        query = text("""
            SELECT trainer_id, trainer_name, session_date, start_time, end_time,
                   member_name, room_name, session_type, status
            FROM trainer_schedule_view
            WHERE trainer_id = :trainer_id AND session_date <= :end_date
            ORDER BY session_date, start_time
        """)
        rows = (
            await db.execute(query, {"trainer_id": str(trainer_id), "end_date": end_date.isoformat()})
        ).fetchall()

        schedule: dict = {
            "trainer_info": {"trainer_name": rows[0].trainer_name if rows else None},
            "personal_training_sessions": [],
            "group_classes": [],
        }
        for row in rows:
            entry = {
                "session_date": row.session_date.isoformat() if row.session_date else None,
                "start_time": row.start_time.isoformat() if row.start_time else None,
                "end_time": row.end_time.isoformat() if row.end_time else None,
                "room_name": row.room_name,
                "status": row.status,
            }
            if row.session_type == "Personal Training":
                entry["member_name"] = row.member_name
                schedule["personal_training_sessions"].append(entry)
            else:
                entry["class_name"] = row.session_type
                schedule["group_classes"].append(entry)
        return schedule
