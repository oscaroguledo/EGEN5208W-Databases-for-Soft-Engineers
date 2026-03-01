from sqlalchemy import Column, UUID, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from core.db import Base
import enum

class EquipmentStatus(enum.Enum):
    operational = "operational"
    under_repair = "under_repair"
    out_of_service = "out_of_service"

class Equipment(Base):
    __tablename__ = "equipments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=False)
    equipment_name = Column(String, nullable=False)
    status = Column(Enum(EquipmentStatus), nullable=False, default=EquipmentStatus.operational)
    maintenance_notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

    room = relationship("Room", back_populates="equipments")
    
    def __repr__(self):
        return f"<Equipment(id='{self.id}', room_id='{self.room_id}', equipment_name='{self.equipment_name}', status='{self.status}', created_at='{self.created_at}', updated_at='{self.updated_at}', deleted_at='{self.deleted_at}')>"
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "room_id": str(self.room_id),
            "equipment_name": self.equipment_name,
            "status": self.status.value,
            "maintenance_notes": self.maintenance_notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "deleted_at": self.deleted_at.isoformat() if self.deleted_at else None,
        }
