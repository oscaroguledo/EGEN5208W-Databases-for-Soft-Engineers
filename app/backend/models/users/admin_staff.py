

from core.db import Base
from sqlalchemy import Column, UUID, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy import DateTime
from datetime import datetime

class AdminStaff(Base):
    __tablename__ = "admin_staff"

    id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    full_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="admin_staff")
    
    def __repr__(self):
        return f"<AdminStaff(id='{self.id}', full_name='{self.full_name}')>"
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "full_name": self.full_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "deleted_at": self.deleted_at.isoformat() if self.deleted_at else None,
        }