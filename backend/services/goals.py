from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from uuid import UUID
from datetime import datetime

from models.fitness import FitnessGoal, HealthMetric


class FitnessGoalService:
    """
    Service layer for FitnessGoal operations
    """

    @staticmethod
    async def get_fitness_goal(db: AsyncSession, goal_id: UUID) -> Optional[FitnessGoal]:
        result = await db.execute(select(FitnessGoal).where(FitnessGoal.id == goal_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def list_fitness_goals(db: AsyncSession, member_id: Optional[UUID] = None) -> List[FitnessGoal]:
        query = select(FitnessGoal)
        if member_id:
            query = query.where(FitnessGoal.member_id == member_id)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def create_fitness_goal(db: AsyncSession, member_id: UUID, description: str, target_value: Optional[str] = None) -> FitnessGoal:
        new_goal = FitnessGoal(
            member_id=member_id,
            description=description,
            target_value=target_value,
            created_at=datetime.utcnow()
        )
        db.add(new_goal)
        await db.commit()
        await db.refresh(new_goal)
        return new_goal

    @staticmethod
    async def update_fitness_goal(db: AsyncSession, goal_id: UUID, **data) -> Optional[FitnessGoal]:
        query = (
            update(FitnessGoal)
            .where(FitnessGoal.id == goal_id)
            .values(**data)
            .returning(FitnessGoal)
        )
        result = await db.execute(query)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def delete_fitness_goal(db: AsyncSession, goal_id: UUID) -> bool:
        result = await db.execute(delete(FitnessGoal).where(FitnessGoal.id == goal_id))
        await db.commit()
        return result.rowcount > 0


class HealthMetricService:
    """
    Service layer for HealthMetric operations
    """

    @staticmethod
    async def get_health_metric(db: AsyncSession, metric_id: UUID) -> Optional[HealthMetric]:
        result = await db.execute(select(HealthMetric).where(HealthMetric.id == metric_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def list_health_metrics(db: AsyncSession, member_id: Optional[UUID] = None) -> List[HealthMetric]:
        query = select(HealthMetric)
        if member_id:
            query = query.where(HealthMetric.member_id == member_id)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def create_health_metric(db: AsyncSession, member_id: UUID, metric_type: str, metric_value: float, recorded_at: datetime) -> HealthMetric:
        new_metric = HealthMetric(
            member_id=member_id,
            metric_type=metric_type,
            metric_value=metric_value,
            recorded_at=recorded_at
        )
        db.add(new_metric)
        await db.commit()
        await db.refresh(new_metric)
        return new_metric

    @staticmethod
    async def update_health_metric(db: AsyncSession, metric_id: UUID, **data) -> Optional[HealthMetric]:
        query = (
            update(HealthMetric)
            .where(HealthMetric.id == metric_id)
            .values(**data)
            .returning(HealthMetric)
        )
        result = await db.execute(query)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def delete_health_metric(db: AsyncSession, metric_id: UUID) -> bool:
        result = await db.execute(delete(HealthMetric).where(HealthMetric.id == metric_id))
        await db.commit()
        return result.rowcount > 0