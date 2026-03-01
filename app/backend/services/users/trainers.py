from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete, and_, func
from uuid import UUID
from datetime import datetime, date, time, timedelta

from models.users.trainers import Trainer
from models.users.user import User, UserRole
from models.trainings import TrainerAvailability, TrainingSession, Class
from core.encryption import PasswordManager

class TrainerService:
    """
    Enhanced service layer for Trainer operations
    """

    @staticmethod
    async def set_availability(
        db: AsyncSession,
        trainer_id: UUID,
        available_date: date,
        start_at: time,
        end_at: time
    ) -> TrainerAvailability:
        """
        Set Availability: INSERT INTO TrainerAvailability
        """
        new_availability = TrainerAvailability(
            trainer_id=trainer_id,
            available_date=available_date,
            start_at=start_at,
            end_at=end_at
        )
        db.add(new_availability)
        await db.commit()
        await db.refresh(new_availability)
        return new_availability

    @staticmethod
    async def get_schedule_view(
        db: AsyncSession,
        trainer_id: UUID,
        days_ahead: int = 7
    ) -> dict:
        """
        Schedule View: SELECT ... FROM Sessions WHERE trainer_id = $1 AND start_time > NOW()
        Returns upcoming sessions and classes
        """
        today = date.today()
        end_date = today + timedelta(days=days_ahead)
        
        # Get upcoming training sessions
        sessions_query = (
            select(TrainingSession, Room, Member)
            .join(Room, TrainingSession.room_id == Room.id)
            .join(Member, TrainingSession.member_id == Member.id)
            .where(
                and_(
                    TrainingSession.trainer_id == trainer_id,
                    TrainingSession.session_date >= today,
                    TrainingSession.session_date <= end_date,
                    TrainingSession.status.in_(["scheduled", "completed"])
                )
            )
            .order_by(TrainingSession.session_date, TrainingSession.start_time)
        )
        
        # Get upcoming classes
        classes_query = (
            select(Class, Room)
            .join(Room, Class.room_id == Room.id)
            .where(
                and_(
                    Class.trainer_id == trainer_id,
                    Class.class_date >= today,
                    Class.class_date <= end_date,
                    Class.deleted_at.is_(None)
                )
            )
            .order_by(Class.class_date, Class.start_time)
        )
        
        # Get trainer's availability for the same period
        availability_query = (
            select(TrainerAvailability)
            .where(
                and_(
                    TrainerAvailability.trainer_id == trainer_id,
                    TrainerAvailability.available_date >= today,
                    TrainerAvailability.available_date <= end_date
                )
            )
            .order_by(TrainerAvailability.available_date, TrainerAvailability.start_at)
        )
        
        sessions_result = await db.execute(sessions_query)
        classes_result = await db.execute(classes_query)
        availability_result = await db.execute(availability_query)
        
        return {
            "upcoming_sessions": sessions_result.all(),
            "upcoming_classes": classes_result.all(),
            "availability": availability_result.scalars().all()
        }

    @staticmethod
    async def get_schedule_with_view(
        db: AsyncSession,
        trainer_id: UUID,
        days_ahead: int = 7
    ) -> dict:
        """
        Get trainer's schedule using database view for optimized performance
        """
        from sqlalchemy import text
        from datetime import datetime, timedelta
        
        end_date = datetime.utcnow().date() + timedelta(days=days_ahead)
        
        # Use the trainer_schedule_view for optimized query
        query = text("""
            SELECT 
                trainer_id,
                trainer_name,
                session_date,
                start_time,
                end_time,
                member_name,
                room_name,
                session_type,
                status
            FROM trainer_schedule_view 
            WHERE trainer_id = :trainer_id
            AND session_date <= :end_date
            ORDER BY session_date, start_time
        """)
        
        result = await db.execute(query, {
            "trainer_id": str(trainer_id),
            "end_date": end_date.isoformat()
        })
        rows = result.fetchall()
        
        # Process the results into schedule format
        schedule = {
            "trainer_info": {
                "trainer_name": rows[0].trainer_name if rows else None
            },
            "personal_training_sessions": [],
            "group_classes": []
        }
        
        for row in rows:
            session_data = {
                "session_date": row.session_date.isoformat() if row.session_date else None,
                "start_time": row.start_time.isoformat() if row.start_time else None,
                "end_time": row.end_time.isoformat() if row.end_time else None,
                "room_name": row.room_name,
                "status": row.status
            }
            
            if row.session_type == "Personal Training":
                session_data["member_name"] = row.member_name
                schedule["personal_training_sessions"].append(session_data)
            else:
                session_data["class_name"] = row.session_type
                schedule["group_classes"].append(session_data)
        
        return schedule

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