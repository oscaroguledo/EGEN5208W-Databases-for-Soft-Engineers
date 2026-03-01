from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from uuid import UUID
from datetime import datetime

from models.fitness import Room, Class, Enrollment, TrainerAvailability, TrainingSession, SessionStatus


class RoomService:
    @staticmethod
    async def get_room(db: AsyncSession, room_id: UUID) -> Optional[Room]:
        result = await db.execute(select(Room).where(Room.id == room_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def list_rooms(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Room]:
        result = await db.execute(select(Room).offset(skip).limit(limit))
        return result.scalars().all()

    @staticmethod
    async def create_room(db: AsyncSession, name: str, capacity: int) -> Room:
        new_room = Room(name=name, capacity=capacity)
        db.add(new_room)
        await db.commit()
        await db.refresh(new_room)
        return new_room

    @staticmethod
    async def update_room(db: AsyncSession, room_id: UUID, **data) -> Optional[Room]:
        query = update(Room).where(Room.id == room_id).values(**data, updated_at=datetime.utcnow()).returning(Room)
        result = await db.execute(query)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def delete_room(db: AsyncSession, room_id: UUID) -> bool:
        result = await db.execute(delete(Room).where(Room.id == room_id))
        await db.commit()
        return result.rowcount > 0


class ClassService:
    @staticmethod
    async def get_class(db: AsyncSession, class_id: UUID) -> Optional[Class]:
        result = await db.execute(select(Class).where(Class.id == class_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def list_classes(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Class]:
        result = await db.execute(select(Class).offset(skip).limit(limit))
        return result.scalars().all()

    @staticmethod
    async def create_class(db: AsyncSession, name: str, trainer_id: UUID, room_id: UUID, class_date, start_time, end_time) -> Class:
        new_class = Class(name=name, trainer_id=trainer_id, room_id=room_id, class_date=class_date, start_time=start_time, end_time=end_time)
        db.add(new_class)
        await db.commit()
        await db.refresh(new_class)
        return new_class

    @staticmethod
    async def update_class(db: AsyncSession, class_id: UUID, **data) -> Optional[Class]:
        query = update(Class).where(Class.id == class_id).values(**data).returning(Class)
        result = await db.execute(query)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def delete_class(db: AsyncSession, class_id: UUID) -> bool:
        result = await db.execute(delete(Class).where(Class.id == class_id))
        await db.commit()
        return result.rowcount > 0


class EnrollmentService:
    @staticmethod
    async def get_enrollment(db: AsyncSession, enrollment_id: UUID) -> Optional[Enrollment]:
        result = await db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def list_enrollments(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Enrollment]:
        result = await db.execute(select(Enrollment).offset(skip).limit(limit))
        return result.scalars().all()

    @staticmethod
    async def create_enrollment(db: AsyncSession, member_id: UUID, class_id: UUID) -> Enrollment:
        new_enrollment = Enrollment(member_id=member_id, class_id=class_id)
        db.add(new_enrollment)
        await db.commit()
        await db.refresh(new_enrollment)
        return new_enrollment

    @staticmethod
    async def delete_enrollment(db: AsyncSession, enrollment_id: UUID) -> bool:
        result = await db.execute(delete(Enrollment).where(Enrollment.id == enrollment_id))
        await db.commit()
        return result.rowcount > 0


class TrainerAvailabilityService:
    @staticmethod
    async def get_availability(db: AsyncSession, availability_id: UUID) -> Optional[TrainerAvailability]:
        result = await db.execute(select(TrainerAvailability).where(TrainerAvailability.id == availability_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def list_availabilities(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[TrainerAvailability]:
        result = await db.execute(select(TrainerAvailability).offset(skip).limit(limit))
        return result.scalars().all()

    @staticmethod
    async def create_availability(db: AsyncSession, trainer_id: UUID, available_date, start_at, end_at) -> TrainerAvailability:
        new_availability = TrainerAvailability(trainer_id=trainer_id, available_date=available_date, start_at=start_at, end_at=end_at)
        db.add(new_availability)
        await db.commit()
        await db.refresh(new_availability)
        return new_availability

    @staticmethod
    async def delete_availability(db: AsyncSession, availability_id: UUID) -> bool:
        result = await db.execute(delete(TrainerAvailability).where(TrainerAvailability.id == availability_id))
        await db.commit()
        return result.rowcount > 0


class TrainingSessionService:
    @staticmethod
    async def get_session(db: AsyncSession, session_id: UUID) -> Optional[TrainingSession]:
        result = await db.execute(select(TrainingSession).where(TrainingSession.id == session_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def list_sessions(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[TrainingSession]:
        result = await db.execute(select(TrainingSession).offset(skip).limit(limit))
        return result.scalars().all()

    @staticmethod
    async def create_session(db: AsyncSession, trainer_id: UUID, member_id: UUID, room_id: UUID, session_date, start_time, end_time, status=SessionStatus.scheduled) -> TrainingSession:
        new_session = TrainingSession(
            trainer_id=trainer_id,
            member_id=member_id,
            room_id=room_id,
            session_date=session_date,
            start_time=start_time,
            end_time=end_time,
            status=status
        )
        db.add(new_session)
        await db.commit()
        await db.refresh(new_session)
        return new_session

    @staticmethod
    async def update_session(db: AsyncSession, session_id: UUID, **data) -> Optional[TrainingSession]:
        query = update(TrainingSession).where(TrainingSession.id == session_id).values(**data).returning(TrainingSession)
        result = await db.execute(query)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def delete_session(db: AsyncSession, session_id: UUID) -> bool:
        result = await db.execute(delete(TrainingSession).where(TrainingSession.id == session_id))
        await db.commit()
        return result.rowcount > 0