from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from uuid import UUID
from datetime import datetime

from models.payments import Payment, PaymentStatus


class PaymentService:

    @staticmethod
    async def get_payment(db: AsyncSession, payment_id: UUID) -> Optional[Payment]:
        result = await db.execute(select(Payment).where(Payment.id == payment_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def list_payments(
        db: AsyncSession,
        member_id: Optional[UUID] = None,
        subscription_id: Optional[UUID] = None,
        status: Optional[str] = None,
    ) -> List[Payment]:
        q = select(Payment)
        if member_id:
            q = q.where(Payment.member_id == member_id)
        if subscription_id:
            q = q.where(Payment.subscription_id == subscription_id)
        if status:
            q = q.where(Payment.status == status)
        return (await db.execute(q)).scalars().all()

    @staticmethod
    async def create_payment(
        db: AsyncSession,
        member_id: UUID,
        subscription_id: UUID,
        amount: float,
        paid_at: datetime,
        payment_method: str,
        status: PaymentStatus = PaymentStatus.pending,
    ) -> Payment:
        obj = Payment(
            member_id=member_id,
            subscription_id=subscription_id,
            amount=amount,
            paid_at=paid_at,
            payment_method=payment_method,
            status=status,
        )
        db.add(obj)
        await db.commit()
        await db.refresh(obj)
        return obj

    @staticmethod
    async def update_payment(db: AsyncSession, payment_id: UUID, **data) -> Optional[Payment]:
        result = await db.execute(
            update(Payment).where(Payment.id == payment_id).values(**data).returning(Payment)
        )
        await db.commit()
        return result.scalar_one_or_none()
