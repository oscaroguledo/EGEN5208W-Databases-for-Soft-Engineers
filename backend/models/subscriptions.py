
from core.db import Base
from sqlalchemy import Column, UUID, String, DECIMAL, DateTime, Date, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy import DateTime
from datetime import datetime
import uuid

class SubscriptionStatus(enum.Enum):
    active = "active"
    expired = "expired"
    cancelled = "cancelled"

    
class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan = Column(String, nullable=False)
    fee = Column(DECIMAL(10,2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    members = relationship("MemberSubscription", back_populates="subscription")
    payments = relationship("Payment", back_populates="subscription")
    
    def __repr__(self):
        return f"<Subscription(id='{self.id}', plan='{self.plan}', fee='{self.fee}')>"
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "plan": self.plan,
            "fee": float(self.fee),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }



class MemberSubscription(Base):
    __tablename__ = "member_subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id = Column(UUID(as_uuid=True), ForeignKey("members.id"), nullable=False)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("subscriptions.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    status = Column(Enum(SubscriptionStatus), nullable=False, default=SubscriptionStatus.active)

    member = relationship("Member", back_populates="subscriptions")
    subscription = relationship("Subscription", back_populates="members")
    
    def __repr__(self):
        return f"<MemberSubscription(id='{self.id}', member_id='{self.member_id}', subscription_id='{self.subscription_id}', start_date='{self.start_date}', end_date='{self.end_date}', status='{self.status}')>"
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "member_id": str(self.member_id),
            "subscription_id": str(self.subscription_id),
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "status": self.status.value,
        }
