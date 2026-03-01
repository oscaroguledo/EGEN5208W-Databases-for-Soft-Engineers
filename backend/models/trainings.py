from sqlalchemy import Column, UUID, String, Integer, Date, Time, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from core.db import Base
import enum

class SessionStatus(enum.Enum):
    scheduled = "scheduled"
    cancelled = "cancelled"
    completed = "completed"

class Room(Base):
    __tablename__ = "rooms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    classes = relationship("Class", back_populates="room")
    training_sessions = relationship("TrainingSession", back_populates="room")
    equipments = relationship("Equipment", back_populates="room")

    def __repr__(self):
        return f"<Room(id='{self.id}', name='{self.name}', capacity='{self.capacity}', created_at='{self.created_at}', updated_at='{self.updated_at}')>"

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "capacity": self.capacity,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class Class(Base):
    __tablename__ = "classes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    trainer_id = Column(UUID(as_uuid=True), ForeignKey("trainers.id"), nullable=False)
    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=False)
    class_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

    trainer = relationship("Trainer", back_populates="classes")
    room = relationship("Room", back_populates="classes")
    enrollments = relationship("Enrollment", back_populates="class_")

    def __repr__(self):
        return f"<Class(id='{self.id}', name='{self.name}', trainer_id='{self.trainer_id}', room_id='{self.room_id}', class_date='{self.class_date}', start_time='{self.start_time}', end_time='{self.end_time}', created_at='{self.created_at}', deleted_at='{self.deleted_at}')>"

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "trainer_id": str(self.trainer_id),
            "room_id": str(self.room_id),
            "class_date": self.class_date.isoformat() if self.class_date else None,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "deleted_at": self.deleted_at.isoformat() if self.deleted_at else None,
        }

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id = Column(UUID(as_uuid=True), ForeignKey("members.id"), nullable=False)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=False)
    registered_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    member = relationship("Member", back_populates="enrollments")
    class_ = relationship("Class", back_populates="enrollments")

    def __repr__(self):
        return f"<Enrollment(id='{self.id}', member_id='{self.member_id}', class_id='{self.class_id}', registered_at='{self.registered_at}')>"

    def to_dict(self):
        return {
            "id": str(self.id),
            "member_id": str(self.member_id),
            "class_id": str(self.class_id),
            "registered_at": self.registered_at.isoformat() if self.registered_at else None,
        }

class TrainerAvailability(Base):
    __tablename__ = "trainer_availability"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trainer_id = Column(UUID(as_uuid=True), ForeignKey("trainers.id"), nullable=False)
    available_date = Column(Date, nullable=False)
    start_at = Column(Time, nullable=False)
    end_at = Column(Time, nullable=False)

    trainer = relationship("Trainer", back_populates="availability")

    def __repr__(self):
        return f"<TrainerAvailability(id='{self.id}', trainer_id='{self.trainer_id}', available_date='{self.available_date}', start_at='{self.start_at}', end_at='{self.end_at}')>"

    def to_dict(self):
        return {
            "id": str(self.id),
            "trainer_id": str(self.trainer_id),
            "available_date": self.available_date.isoformat() if self.available_date else None,
            "start_at": self.start_at.isoformat() if self.start_at else None,
            "end_at": self.end_at.isoformat() if self.end_at else None,
        }

class TrainingSession(Base):
    __tablename__ = "training_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trainer_id = Column(UUID(as_uuid=True), ForeignKey("trainers.id"), nullable=False)
    member_id = Column(UUID(as_uuid=True), ForeignKey("members.id"), nullable=False)
    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=False)
    session_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    status = Column(Enum(SessionStatus), nullable=False, default=SessionStatus.scheduled)
    created_at = Column(DateTime, default=datetime.utcnow)

    trainer = relationship("Trainer", back_populates="training_sessions")
    member = relationship("Member", back_populates="training_sessions")
    room = relationship("Room", back_populates="training_sessions")

    def __repr__(self):
        return f"<TrainingSession(id='{self.id}', trainer_id='{self.trainer_id}', member_id='{self.member_id}', room_id='{self.room_id}', session_date='{self.session_date}', start_time='{self.start_time}', end_time='{self.end_time}', status='{self.status}', created_at='{self.created_at}')>"

    def to_dict(self):
        return {
            "id": str(self.id),
            "trainer_id": str(self.trainer_id),
            "member_id": str(self.member_id),
            "room_id": str(self.room_id),
            "session_date": self.session_date.isoformat() if self.session_date else None,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "status": self.status.value if self.status else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
    