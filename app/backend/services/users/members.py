from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete, and_, or_, func
from uuid import UUID
from datetime import datetime, date, time, timedelta

from core.encryption import PasswordManager
from models.users.user import User, UserRole
from models.users.members import Member
from models.goals import FitnessGoal, HealthMetric
from models.trainings import Class, Enrollment, TrainingSession, TrainerAvailability, SessionStatus
from models.equipments import Equipment, EquipmentStatus

class MemberService:
    """
    Enhanced service layer for managing Member operations
    """

    @staticmethod
    async def register_member(
        db: AsyncSession,
        email: str,
        password: str,
        full_name: str,
        date_of_birth: date,
        gender: str,
        phone: str
    ) -> Member:
        """
        Complete member registration: INSERT INTO Users then INSERT INTO Members
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
    async def update_profile_goals(
        db: AsyncSession,
        member_id: UUID,
        goals_data: List[dict]
    ) -> List[FitnessGoal]:
        """
        Profile Management: UPDATE Members for goals; INSERT INTO HealthMetrics
        """
        updated_goals = []
        
        for goal_data in goals_data:
            if goal_data.get("id"):
                # Update existing goal
                goal = await db.execute(
                    select(FitnessGoal).where(FitnessGoal.id == goal_data["id"])
                )
                goal_obj = goal.scalar_one_or_none()
                if goal_obj:
                    for key, value in goal_data.items():
                        if key != "id":
                            setattr(goal_obj, key, value)
                    updated_goals.append(goal_obj)
            else:
                # Create new goal
                new_goal = FitnessGoal(
                    member_id=member_id,
                    description=goal_data.get("description"),
                    target_value=goal_data.get("target_value"),
                    created_at=datetime.utcnow()
                )
                db.add(new_goal)
                updated_goals.append(new_goal)
        
        await db.commit()
        return updated_goals

    @staticmethod
    async def get_health_history(
        db: AsyncSession,
        member_id: UUID,
        metric_type: Optional[str] = None,
        limit: int = 100
    ) -> List[HealthMetric]:
        """
        Health History: SELECT ... FROM HealthMetrics WHERE user_id = $1 ORDER BY recorded_at
        """
        query = select(HealthMetric).where(HealthMetric.member_id == member_id)
        
        if metric_type:
            query = query.where(HealthMetric.metric_type == metric_type)
            
        query = query.order_by(HealthMetric.recorded_at.desc()).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_dashboard_schedule(
        db: AsyncSession,
        member_id: UUID,
        days_ahead: int = 30
    ) -> dict:
        """
        Dashboard: SELECT * FROM UpcomingSchedule WHERE member_id = $1
        Returns upcoming classes and training sessions
        """
        today = date.today()
        end_date = today + timedelta(days=days_ahead)
        
        # Get upcoming classes
        classes_query = (
            select(Class, Room, Trainer)
            .join(Enrollment, Class.id == Enrollment.class_id)
            .join(Room, Class.room_id == Room.id)
            .join(Trainer, Class.trainer_id == Trainer.id)
            .where(
                and_(
                    Enrollment.member_id == member_id,
                    Class.class_date >= today,
                    Class.class_date <= end_date,
                    Class.deleted_at.is_(None)
                )
            )
            .order_by(Class.class_date, Class.start_time)
        )
        
        # Get upcoming training sessions
        sessions_query = (
            select(TrainingSession, Room, Trainer)
            .join(Room, TrainingSession.room_id == Room.id)
            .join(Trainer, TrainingSession.trainer_id == Trainer.id)
            .where(
                and_(
                    TrainingSession.member_id == member_id,
                    TrainingSession.session_date >= today,
                    TrainingSession.session_date <= end_date,
                    TrainingSession.status.in_(["scheduled", "completed"])
                )
            )
            .order_by(TrainingSession.session_date, TrainingSession.start_time)
        )
        
        classes_result = await db.execute(classes_query)
        sessions_result = await db.execute(sessions_query)
        
        return {
            "upcoming_classes": classes_result.all(),
            "upcoming_sessions": sessions_result.all()
        }

    @staticmethod
    async def enroll_in_class(
        db: AsyncSession,
        member_id: UUID,
        class_id: UUID
    ) -> Enrollment:
        """
        Enroll a member in a class with capacity checking
        """
        # Check if class exists and get capacity info
        class_query = select(Class).where(Class.id == class_id, Class.deleted_at.is_(None))
        class_result = await db.execute(class_query)
        class_obj = class_result.scalar_one_or_none()
        
        if not class_obj:
            raise ValueError("Class not found")
        
        # Check current enrollment count
        enrollment_count_query = (
            select(func.count(Enrollment.id))
            .where(Enrollment.class_id == class_id)
        )
        enrollment_result = await db.execute(enrollment_count_query)
        current_enrollments = enrollment_result.scalar()
        
        # Check if class is full
        if current_enrollments >= class_obj.max_capacity:
            raise ValueError("Class is full")
        
        # Check for duplicate enrollment
        existing_enrollment_query = (
            select(Enrollment)
            .where(
                and_(
                    Enrollment.member_id == member_id,
                    Enrollment.class_id == class_id
                )
            )
        )
        existing_result = await db.execute(existing_enrollment_query)
        if existing_result.scalar_one_or_none():
            raise ValueError("Member already enrolled in this class")
        
        # Create enrollment
        new_enrollment = Enrollment(
            member_id=member_id,
            class_id=class_id,
            registered_at=datetime.utcnow()
        )
        
        db.add(new_enrollment)
        await db.commit()
        await db.refresh(new_enrollment)
        
        return new_enrollment

    @staticmethod
    async def cancel_class_enrollment(
        db: AsyncSession,
        member_id: UUID,
        class_id: UUID
    ) -> bool:
        """
        Cancel a class enrollment
        """
        query = (
            delete(Enrollment)
            .where(
                and_(
                    Enrollment.member_id == member_id,
                    Enrollment.class_id == class_id
                )
            )
        )
        
        result = await db.execute(query)
        await db.commit()
        return result.rowcount > 0

    @staticmethod
    async def book_training_session(
        db: AsyncSession,
        member_id: UUID,
        trainer_id: UUID,
        room_id: UUID,
        session_date: date,
        start_time: time,
        end_time: time
    ) -> TrainingSession:
        """
        Book a personal training session with conflict checking
        """
        # Check for member's existing sessions at the same time
        member_conflict_query = (
            select(TrainingSession)
            .where(
                and_(
                    TrainingSession.member_id == member_id,
                    TrainingSession.session_date == session_date,
                    TrainingSession.status.in_(["scheduled", "completed"]),
                    or_(
                        and_(
                            TrainingSession.start_time <= start_time,
                            TrainingSession.end_time > start_time
                        ),
                        and_(
                            TrainingSession.start_time < end_time,
                            TrainingSession.end_time >= end_time
                        ),
                        and_(
                            TrainingSession.start_time >= start_time,
                            TrainingSession.end_time <= end_time
                        )
                    )
                )
            )
        )
        
        member_conflicts = await db.execute(member_conflict_query)
        if member_conflicts.scalars().all():
            raise ValueError("Member has overlapping booking")
        
        # Check for trainer availability
        trainer_conflict_query = (
            select(TrainingSession)
            .where(
                and_(
                    TrainingSession.trainer_id == trainer_id,
                    TrainingSession.session_date == session_date,
                    TrainingSession.status.in_(["scheduled", "completed"]),
                    or_(
                        and_(
                            TrainingSession.start_time <= start_time,
                            TrainingSession.end_time > start_time
                        ),
                        and_(
                            TrainingSession.start_time < end_time,
                            TrainingSession.end_time >= end_time
                        ),
                        and_(
                            TrainingSession.start_time >= start_time,
                            TrainingSession.end_time <= end_time
                        )
                    )
                )
            )
        )
        
        trainer_conflicts = await db.execute(trainer_conflict_query)
        if trainer_conflicts.scalars().all():
            raise ValueError("Trainer is not available at this time")
        
        # Check room availability
        room_conflict_query = (
            select(TrainingSession)
            .where(
                and_(
                    TrainingSession.room_id == room_id,
                    TrainingSession.session_date == session_date,
                    TrainingSession.status.in_(["scheduled", "completed"]),
                    or_(
                        and_(
                            TrainingSession.start_time <= start_time,
                            TrainingSession.end_time > start_time
                        ),
                        and_(
                            TrainingSession.start_time < end_time,
                            TrainingSession.end_time >= end_time
                        ),
                        and_(
                            TrainingSession.start_time >= start_time,
                            TrainingSession.end_time <= end_time
                        )
                    )
                )
            )
        )
        
        room_conflicts = await db.execute(room_conflict_query)
        if room_conflicts.scalars().all():
            raise ValueError("Room is not available at this time")
        
        # Create the training session
        new_session = TrainingSession(
            trainer_id=trainer_id,
            member_id=member_id,
            room_id=room_id,
            session_date=session_date,
            start_time=start_time,
            end_time=end_time,
            status=SessionStatus.scheduled,
            created_at=datetime.utcnow()
        )
        
        db.add(new_session)
        await db.commit()
        await db.refresh(new_session)
        
        return new_session

    @staticmethod
    async def cancel_training_session(
        db: AsyncSession,
        member_id: UUID,
        session_id: UUID
    ) -> bool:
        """
        Cancel a training session (member can only cancel their own sessions)
        """
        query = (
            update(TrainingSession)
            .where(
                and_(
                    TrainingSession.id == session_id,
                    TrainingSession.member_id == member_id,
                    TrainingSession.status == "scheduled"
                )
            )
            .values(status="cancelled", updated_at=datetime.utcnow())
        )
        
        result = await db.execute(query)
        await db.commit()
        return result.rowcount > 0

    @staticmethod
    async def add_health_metric(
        db: AsyncSession,
        member_id: UUID,
        metric_type: str,
        metric_value: float,
        recorded_at: datetime
    ) -> HealthMetric:
        """
        Add a new health metric record (append-only)
        """
        from models.goals import HealthMetric
        
        new_metric = HealthMetric(
            member_id=member_id,
            metric_type=metric_type,
            metric_value=metric_value,
            recorded_at=recorded_at,
            created_at=datetime.utcnow()
        )
        
        db.add(new_metric)
        await db.commit()
        await db.refresh(new_metric)
        
        return new_metric

    @staticmethod
    async def get_dashboard_with_view(
        db: AsyncSession,
        member_id: UUID
    ) -> dict:
        """
        Get member dashboard using database view for optimized performance
        """
        from sqlalchemy import text
        
        # Use the member_dashboard_view for optimized query
        query = text("""
            SELECT DISTINCT 
                member_id,
                full_name,
                email,
                metric_type,
                metric_value,
                recorded_at,
                goal_description,
                goal_target,
                total_classes_attended,
                session_date,
                start_time,
                end_time,
                trainer_name,
                room_name,
                class_name,
                class_date,
                class_start_time,
                class_end_time
            FROM member_dashboard_view 
            WHERE member_id = :member_id
            ORDER BY recorded_at DESC NULLS LAST, session_date ASC
        """)
        
        result = await db.execute(query, {"member_id": str(member_id)})
        rows = result.fetchall()
        
        # Process the results into dashboard format
        dashboard = {
            "member_info": {
                "full_name": rows[0].full_name if rows else None,
                "email": rows[0].email if rows else None
            },
            "recent_health_metrics": [],
            "active_goals": [],
            "upcoming_sessions": [],
            "upcoming_classes": [],
            "total_classes_attended": 0
        }
        
        for row in rows:
            # Health metrics
            if row.metric_type:
                dashboard["recent_health_metrics"].append({
                    "metric_type": row.metric_type,
                    "metric_value": float(row.metric_value),
                    "recorded_at": row.recorded_at.isoformat() if row.recorded_at else None
                })
            
            # Goals
            if row.goal_description:
                dashboard["active_goals"].append({
                    "description": row.goal_description,
                    "target_value": row.goal_target
                })
            
            # Training sessions
            if row.session_date and row.trainer_name:
                dashboard["upcoming_sessions"].append({
                    "session_date": row.session_date.isoformat() if row.session_date else None,
                    "start_time": row.start_time.isoformat() if row.start_time else None,
                    "end_time": row.end_time.isoformat() if row.end_time else None,
                    "trainer_name": row.trainer_name,
                    "room_name": row.room_name
                })
            
            # Classes
            if row.class_date and row.class_name:
                dashboard["upcoming_classes"].append({
                    "class_date": row.class_date.isoformat() if row.class_date else None,
                    "class_name": row.class_name,
                    "start_time": row.class_start_time.isoformat() if row.class_start_time else None,
                    "end_time": row.class_end_time.isoformat() if row.class_end_time else None,
                    "room_name": row.room_name
                })
            
            # Total classes
            if row.total_classes_attended:
                dashboard["total_classes_attended"] = row.total_classes_attended
        
        return dashboard

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