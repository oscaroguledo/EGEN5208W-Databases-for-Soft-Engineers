from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete, and_, or_, func
from uuid import UUID
from datetime import datetime, date, time, timedelta

from core.encryption import PasswordManager
from models.users.user import User, UserRole
from models.users.members import Member
from models.goals import FitnessGoal, HealthMetric
from models.trainings import Class, Enrollment, TrainingSession, SessionStatus


class MemberService:

    @staticmethod
    async def register_member(
        db: AsyncSession,
        email: str,
        password: str,
        full_name: str,
        date_of_birth: date,
        gender: str,
        phone: str,
    ) -> Member:
        hashed_password = await PasswordManager.hash_password(password)
        new_user = User(email=email, password=hashed_password, role=UserRole.member)
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        new_member = Member(
            id=new_user.id,
            full_name=full_name,
            date_of_birth=date_of_birth,
            gender=gender,
            phone=phone,
        )
        db.add(new_member)
        await db.commit()
        await db.refresh(new_member)
        return new_member

    @staticmethod
    async def get_member(db: AsyncSession, member_id: UUID) -> Optional[Member]:
        result = await db.execute(select(Member).where(Member.id == member_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def update_member(db: AsyncSession, member_id: UUID, **data) -> Optional[Member]:
        query = (
            update(Member)
            .where(Member.id == member_id)
            .values(**data, updated_at=datetime.utcnow())
            .returning(Member)
        )
        result = await db.execute(query)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def list_members(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        gender: Optional[str] = None,
    ) -> Tuple[List[Member], int]:
        count_q = select(func.count(Member.id))
        data_q = select(Member)
        if gender:
            count_q = count_q.where(Member.gender == gender)
            data_q = data_q.where(Member.gender == gender)
        total = (await db.execute(count_q)).scalar()
        members = (await db.execute(data_q.offset(skip).limit(limit))).scalars().all()
        return members, total

    # ── goals ──────────────────────────────────────────────────────────────

    @staticmethod
    async def update_profile_goals(
        db: AsyncSession,
        member_id: UUID,
        goals_data: List[dict],
    ) -> List[FitnessGoal]:
        updated = []
        for gd in goals_data:
            if gd.get("id"):
                res = await db.execute(select(FitnessGoal).where(FitnessGoal.id == gd["id"]))
                obj = res.scalar_one_or_none()
                if obj:
                    for k, v in gd.items():
                        if k != "id":
                            setattr(obj, k, v)
                    updated.append(obj)
            else:
                obj = FitnessGoal(
                    member_id=member_id,
                    description=gd.get("description"),
                    target_value=gd.get("target_value"),
                    created_at=datetime.utcnow(),
                )
                db.add(obj)
                updated.append(obj)
        await db.commit()
        return updated

    @staticmethod
    async def list_fitness_goals(
        db: AsyncSession,
        member_id: Optional[UUID],
        skip: int = 0,
        limit: int = 20,
    ) -> List[FitnessGoal]:
        q = select(FitnessGoal)
        if member_id:
            q = q.where(FitnessGoal.member_id == member_id)
        q = q.order_by(FitnessGoal.created_at.desc()).offset(skip).limit(limit)
        return (await db.execute(q)).scalars().all()

    # ── health metrics ─────────────────────────────────────────────────────

    @staticmethod
    async def get_health_metrics(
        db: AsyncSession,
        member_id: UUID,
        metric_type: Optional[str] = None,
        limit: int = 100,
    ) -> List[HealthMetric]:
        q = select(HealthMetric).where(HealthMetric.member_id == member_id)
        if metric_type:
            q = q.where(HealthMetric.metric_type == metric_type)
        q = q.order_by(HealthMetric.recorded_at.desc()).limit(limit)
        return (await db.execute(q)).scalars().all()

    @staticmethod
    async def add_health_metric(
        db: AsyncSession,
        member_id: UUID,
        metric_type: str,
        metric_value: float,
        recorded_at: datetime,
    ) -> HealthMetric:
        obj = HealthMetric(
            member_id=member_id,
            metric_type=metric_type,
            metric_value=metric_value,
            recorded_at=recorded_at,
        )
        db.add(obj)
        await db.commit()
        await db.refresh(obj)
        return obj

    # ── classes ────────────────────────────────────────────────────────────

    @staticmethod
    async def list_available_classes(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        class_date: Optional[date] = None,
    ) -> List[Class]:
        q = select(Class).where(Class.class_date >= date.today())
        if class_date:
            q = q.where(Class.class_date == class_date)
        q = q.order_by(Class.class_date, Class.start_time).offset(skip).limit(limit)
        return (await db.execute(q)).scalars().all()

    @staticmethod
    async def enroll_in_class(
        db: AsyncSession,
        member_id: UUID,
        class_id: UUID,
    ) -> Enrollment:
        # Check class exists
        cls = (await db.execute(select(Class).where(Class.id == class_id))).scalar_one_or_none()
        if not cls:
            raise ValueError("Class not found")

        # Check capacity
        count = (
            await db.execute(
                select(func.count(Enrollment.id)).where(Enrollment.class_id == class_id)
            )
        ).scalar()
        if count >= cls.max_capacity:
            raise ValueError("Class is full")

        # Check duplicate
        existing = (
            await db.execute(
                select(Enrollment).where(
                    and_(Enrollment.member_id == member_id, Enrollment.class_id == class_id)
                )
            )
        ).scalar_one_or_none()
        if existing:
            raise ValueError("Member already enrolled in this class")

        obj = Enrollment(member_id=member_id, class_id=class_id, registered_at=datetime.utcnow())
        db.add(obj)
        await db.commit()
        await db.refresh(obj)
        return obj

    @staticmethod
    async def cancel_class_enrollment(
        db: AsyncSession,
        member_id: UUID,
        class_id: UUID,
    ) -> bool:
        result = await db.execute(
            delete(Enrollment).where(
                and_(Enrollment.member_id == member_id, Enrollment.class_id == class_id)
            )
        )
        await db.commit()
        return result.rowcount > 0

    # ── training sessions ──────────────────────────────────────────────────

    @staticmethod
    async def book_training_session(
        db: AsyncSession,
        member_id: UUID,
        trainer_id: UUID,
        room_id: UUID,
        session_date: date,
        start_time: time,
        end_time: time,
    ) -> TrainingSession:
        def overlap_conditions(table, date_col, start_col, end_col):
            return and_(
                date_col == session_date,
                table.status == SessionStatus.scheduled,
                or_(
                    and_(start_col <= start_time, end_col > start_time),
                    and_(start_col < end_time, end_col >= end_time),
                    and_(start_col >= start_time, end_col <= end_time),
                ),
            )

        for col, val, msg in [
            (TrainingSession.member_id, member_id, "Member has overlapping booking"),
            (TrainingSession.trainer_id, trainer_id, "Trainer is not available at this time"),
            (TrainingSession.room_id, room_id, "Room is not available at this time"),
        ]:
            q = select(TrainingSession).where(
                col == val,
                overlap_conditions(
                    TrainingSession,
                    TrainingSession.session_date,
                    TrainingSession.start_time,
                    TrainingSession.end_time,
                ),
            )
            if (await db.execute(q)).scalars().first():
                raise ValueError(msg)

        obj = TrainingSession(
            trainer_id=trainer_id,
            member_id=member_id,
            room_id=room_id,
            session_date=session_date,
            start_time=start_time,
            end_time=end_time,
            status=SessionStatus.scheduled,
        )
        db.add(obj)
        await db.commit()
        await db.refresh(obj)
        return obj

    @staticmethod
    async def cancel_training_session(
        db: AsyncSession,
        member_id: UUID,
        session_id: UUID,
    ) -> bool:
        result = await db.execute(
            update(TrainingSession)
            .where(
                TrainingSession.id == session_id,
                TrainingSession.member_id == member_id,
                TrainingSession.status == SessionStatus.scheduled,
            )
            .values(status=SessionStatus.cancelled)
        )
        await db.commit()
        return result.rowcount > 0

    # ── dashboard ──────────────────────────────────────────────────────────

    @staticmethod
    async def get_dashboard_schedule(
        db: AsyncSession,
        member_id: UUID,
        days_ahead: int = 30,
    ) -> dict:
        today = date.today()
        end_date = today + timedelta(days=days_ahead)

        classes_q = (
            select(Class)
            .join(Enrollment, Class.id == Enrollment.class_id)
            .where(
                Enrollment.member_id == member_id,
                Class.class_date >= today,
                Class.class_date <= end_date,
            )
            .order_by(Class.class_date, Class.start_time)
        )
        sessions_q = (
            select(TrainingSession)
            .where(
                TrainingSession.member_id == member_id,
                TrainingSession.session_date >= today,
                TrainingSession.session_date <= end_date,
                TrainingSession.status == SessionStatus.scheduled,
            )
            .order_by(TrainingSession.session_date, TrainingSession.start_time)
        )

        classes = (await db.execute(classes_q)).scalars().all()
        sessions = (await db.execute(sessions_q)).scalars().all()

        return {
            "upcoming_classes": [c.to_dict() for c in classes],
            "upcoming_sessions": [s.to_dict() for s in sessions],
        }

    @staticmethod
    async def get_dashboard_with_view(db: AsyncSession, member_id: UUID) -> dict:
        from sqlalchemy import text
        query = text("""
            SELECT DISTINCT
                member_id, full_name, email,
                metric_type, metric_value, recorded_at,
                goal_description, goal_target, total_classes_attended,
                session_date, start_time, end_time,
                trainer_name, room_name,
                class_name, class_date, class_start_time, class_end_time
            FROM member_dashboard_view
            WHERE member_id = :member_id
            ORDER BY recorded_at DESC NULLS LAST, session_date ASC
        """)
        rows = (await db.execute(query, {"member_id": str(member_id)})).fetchall()
        dashboard = {
            "member_info": {
                "full_name": rows[0].full_name if rows else None,
                "email": rows[0].email if rows else None,
            },
            "recent_health_metrics": [],
            "active_goals": [],
            "upcoming_sessions": [],
            "upcoming_classes": [],
            "total_classes_attended": 0,
        }
        for row in rows:
            if row.metric_type:
                dashboard["recent_health_metrics"].append({
                    "metric_type": row.metric_type,
                    "metric_value": float(row.metric_value),
                    "recorded_at": row.recorded_at.isoformat() if row.recorded_at else None,
                })
            if row.goal_description:
                dashboard["active_goals"].append({
                    "description": row.goal_description,
                    "target_value": row.goal_target,
                })
            if row.session_date and row.trainer_name:
                dashboard["upcoming_sessions"].append({
                    "session_date": row.session_date.isoformat(),
                    "start_time": row.start_time.isoformat() if row.start_time else None,
                    "end_time": row.end_time.isoformat() if row.end_time else None,
                    "trainer_name": row.trainer_name,
                    "room_name": row.room_name,
                })
            if row.class_date and row.class_name:
                dashboard["upcoming_classes"].append({
                    "class_date": row.class_date.isoformat(),
                    "class_name": row.class_name,
                    "start_time": row.class_start_time.isoformat() if row.class_start_time else None,
                    "end_time": row.class_end_time.isoformat() if row.class_end_time else None,
                    "room_name": row.room_name,
                })
            if row.total_classes_attended:
                dashboard["total_classes_attended"] = row.total_classes_attended
        return dashboard
