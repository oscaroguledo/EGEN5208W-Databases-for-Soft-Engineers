from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from uuid import UUID
from datetime import datetime

from models.payments import Payment


class PaymentService:
    """
    Service layer for Payment operations
    """

    @staticmethod
    async def get_payment(db: AsyncSession, payment_id: UUID) -> Optional[Payment]:
        result = await db.execute(
            select(Payment).where(Payment.id == payment_id, Payment.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_payments(
        db: AsyncSession,
        member_id: Optional[UUID] = None,
        subscription_id: Optional[UUID] = None,
        status: Optional[str] = None
    ) -> List[Payment]:
        query = select(Payment).where(Payment.deleted_at.is_(None))
        if member_id:
            query = query.where(Payment.member_id == member_id)
        if subscription_id:
            query = query.where(Payment.subscription_id == subscription_id)
        if status:
            query = query.where(Payment.status == status)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def create_payment(
        db: AsyncSession,
        member_id: UUID,
        subscription_id: UUID,
        amount: float,
        paid_at: datetime,
        status: str = "pending"
    ) -> Payment:
        new_payment = Payment(
            member_id=member_id,
            subscription_id=subscription_id,
            amount=amount,
            paid_at=paid_at,
            status=status
        )
        db.add(new_payment)
        await db.commit()
        await db.refresh(new_payment)
        return new_payment

    @staticmethod
    async def update_payment(db: AsyncSession, payment_id: UUID, **data) -> Optional[Payment]:
        query = (
            update(Payment)
            .where(Payment.id == payment_id, Payment.deleted_at.is_(None))
            .values(**data)
            .returning(Payment)
        )
        result = await db.execute(query)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def soft_delete_payment(db: AsyncSession, payment_id: UUID) -> bool:
        """
        Marks a payment as deleted instead of actually deleting
        """
        result = await db.execute(
            update(Payment)
            .where(Payment.id == payment_id, Payment.deleted_at.is_(None))
            .values(deleted_at=datetime.utcnow())
        )
        await db.commit()
        return result.rowcount > 0

    @staticmethod
    async def hard_delete_payment(db: AsyncSession, payment_id: UUID) -> bool:
        """
        Permanently deletes a payment
        """
        result = await db.execute(delete(Payment).where(Payment.id == payment_id))
        await db.commit()
        return result.rowcount > 0