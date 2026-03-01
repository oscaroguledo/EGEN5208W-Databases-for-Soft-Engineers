from sqlalchemy import Column, UUID, String, DateTime, ForeignKey, Enum, DECIMAL
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from core.db import Base
import enum

class PaymentStatus(enum.Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"

class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id = Column(UUID(as_uuid=True), ForeignKey("members.id"), nullable=False)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("subscriptions.id"), nullable=False)
    amount = Column(DECIMAL(10,2), nullable=False)
    paid_at = Column(DateTime, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.pending)

    member = relationship("Member", back_populates="payments")
    subscription = relationship("Subscription", back_populates="payments")
    
    def __repr__(self):
        return f"<Payment(id='{self.id}', member_id='{self.member_id}', subscription_id='{self.subscription_id}', amount='{self.amount}', paid_at='{self.paid_at}', deleted_at='{self.deleted_at}', status='{self.status}')>"
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "member_id": str(self.member_id),
            "subscription_id": str(self.subscription_id),
            "amount": float(self.amount),
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
            "deleted_at": self.deleted_at.isoformat() if self.deleted_at else None,
            "status": self.status.value,
        }
    