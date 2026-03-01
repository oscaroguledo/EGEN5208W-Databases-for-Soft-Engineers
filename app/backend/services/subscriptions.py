from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from uuid import UUID
from datetime import datetime

from models.subscriptions import Subscription, MemberSubscription, SubscriptionStatus


class SubscriptionService:
    """
    Service layer for Subscription operations
    """

    @staticmethod
    async def get_subscription(db: AsyncSession, subscription_id: UUID) -> Optional[Subscription]:
        result = await db.execute(
            select(Subscription).where(Subscription.id == subscription_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_subscriptions(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Subscription]:
        query = select(Subscription).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def create_subscription(db: AsyncSession, plan: str, fee: float) -> Subscription:
        new_subscription = Subscription(plan=plan, fee=fee)
        db.add(new_subscription)
        await db.commit()
        await db.refresh(new_subscription)
        return new_subscription

    @staticmethod
    async def update_subscription(db: AsyncSession, subscription_id: UUID, **data) -> Optional[Subscription]:
        query = (
            update(Subscription)
            .where(Subscription.id == subscription_id)
            .values(**data, updated_at=datetime.utcnow())
            .returning(Subscription)
        )
        result = await db.execute(query)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def delete_subscription(db: AsyncSession, subscription_id: UUID) -> bool:
        """
        Permanently deletes a subscription
        """
        result = await db.execute(delete(Subscription).where(Subscription.id == subscription_id))
        await db.commit()
        return result.rowcount > 0


class MemberSubscriptionService:
    """
    Service layer for MemberSubscription operations
    """

    @staticmethod
    async def get_member_subscription(db: AsyncSession, member_subscription_id: UUID) -> Optional[MemberSubscription]:
        result = await db.execute(
            select(MemberSubscription).where(MemberSubscription.id == member_subscription_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_member_subscriptions(
        db: AsyncSession,
        member_id: Optional[UUID] = None,
        subscription_id: Optional[UUID] = None,
        status: Optional[SubscriptionStatus] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[MemberSubscription]:
        query = select(MemberSubscription)
        if member_id:
            query = query.where(MemberSubscription.member_id == member_id)
        if subscription_id:
            query = query.where(MemberSubscription.subscription_id == subscription_id)
        if status:
            query = query.where(MemberSubscription.status == status)
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def create_member_subscription(
        db: AsyncSession,
        member_id: UUID,
        subscription_id: UUID,
        start_date: datetime,
        end_date: Optional[datetime] = None,
        status: SubscriptionStatus = SubscriptionStatus.active
    ) -> MemberSubscription:
        new_member_subscription = MemberSubscription(
            member_id=member_id,
            subscription_id=subscription_id,
            start_date=start_date,
            end_date=end_date,
            status=status
        )
        db.add(new_member_subscription)
        await db.commit()
        await db.refresh(new_member_subscription)
        return new_member_subscription

    @staticmethod
    async def update_member_subscription(db: AsyncSession, member_subscription_id: UUID, **data) -> Optional[MemberSubscription]:
        query = (
            update(MemberSubscription)
            .where(MemberSubscription.id == member_subscription_id)
            .values(**data)
            .returning(MemberSubscription)
        )
        result = await db.execute(query)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def delete_member_subscription(db: AsyncSession, member_subscription_id: UUID) -> bool:
        result = await db.execute(delete(MemberSubscription).where(MemberSubscription.id == member_subscription_id))
        await db.commit()
        return result.rowcount > 0