

from sqlalchemy import Column, String, Enum
from sqlalchemy.dialects.postgresql import UUID
from core.db import Base
import uuid
from datetime import datetime

class UserRole(str, Enum):
    admin = "admin"
    trainer = "trainer"
    member = "member"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.member, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    member = relationship("Member", back_populates="user", uselist=False)
    trainer = relationship("Trainer", back_populates="user", uselist=False)
    admin_staff = relationship("AdminStaff", back_populates="user", uselist=False)
    def __repr__(self):
        return f"<User(email='{self.email}', role='{self.role}')>"
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
