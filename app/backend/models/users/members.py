

from core.db import Base
from sqlalchemy import Column, UUID, ForeignKey, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy import Enum
from datetime import datetime
import enum
from sqlalchemy import Date

class Gender(enum.Enum):
    male = "male"
    female = "female"

class Member(Base):
    __tablename__ = "members"

    id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    full_name = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(Enum(Gender), nullable=False)
    phone = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="member")
    subscriptions = relationship("MemberSubscription", back_populates="member")
    fitness_goals = relationship("FitnessGoal", back_populates="member")
    health_metrics = relationship("HealthMetric", back_populates="member")
    enrollments = relationship("Enrollment", back_populates="member")
    training_sessions = relationship("TrainingSession", back_populates="member")
    payments = relationship("Payment", back_populates="member")

    def __repr__(self):
        return f"<Member(id='{self.id}', full_name='{self.full_name}', phone='{self.phone}')>"

    def to_dict(self):
        return {
            "id": str(self.id),
            "full_name": self.full_name,
            "date_of_birth": self.date_of_birth.isoformat() if self.date_of_birth else None,
            "gender": self.gender.value if self.gender else None,
            "phone": self.phone,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "deleted_at": self.deleted_at.isoformat() if self.deleted_at else None,
        }
