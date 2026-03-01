from core.db import Base
from sqlalchemy import Column, UUID, String, DECIMAL, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

class FitnessGoal(Base):
    __tablename__ = "fitness_goals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id = Column(UUID(as_uuid=True), ForeignKey("members.id"), nullable=False)
    description = Column(String, nullable=False)
    target_value = Column(String)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    member = relationship("Member", back_populates="fitness_goals")

    def __repr__(self):
        return f"<FitnessGoal(id='{self.id}', member_id='{self.member_id}', description='{self.description}', target_value='{self.target_value}', created_at='{self.created_at}')>"

    def to_dict(self):
        return {
            "id": str(self.id),
            "member_id": str(self.member_id),
            "description": self.description,
            "target_value": self.target_value,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class HealthMetric(Base):
    __tablename__ = "health_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id = Column(UUID(as_uuid=True), ForeignKey("members.id"), nullable=False)
    metric_type = Column(String, nullable=False)
    metric_value = Column(DECIMAL(10,2))
    recorded_at = Column(DateTime, nullable=False)

    member = relationship("Member", back_populates="health_metrics")

    def __repr__(self):
        return f"<HealthMetric(id='{self.id}', member_id='{self.member_id}', metric_type='{self.metric_type}', metric_value='{self.metric_value}', recorded_at='{self.recorded_at}')>"

    def to_dict(self):
        return {
            "id": str(self.id),
            "member_id": str(self.member_id),
            "metric_type": self.metric_type,
            "metric_value": float(self.metric_value) if self.metric_value else None,
            "recorded_at": self.recorded_at.isoformat() if self.recorded_at else None,
        }
