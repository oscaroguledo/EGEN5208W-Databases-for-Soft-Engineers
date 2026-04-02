"""Shared test helpers — insert users/rooms directly into the DB."""
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession

from core.encryption import PasswordManager
from models.users.user import User, UserRole
from models.users.members import Member
from models.users.trainers import Trainer
from models.users.admin_staff import AdminStaff
from models.trainings import Room


async def create_user_with_role(db: AsyncSession, email: str, password: str, role: str) -> User:
    hashed = await PasswordManager.hash_password(password)
    user = User(email=email, password=hashed, role=UserRole(role))
    db.add(user)
    await db.commit()
    await db.refresh(user)

    if role == "member":
        # Use a phone derived from email to stay unique across tests
        phone = f"555-{abs(hash(email)) % 10_000_000:07d}"
        profile = Member(
            id=user.id,
            full_name="Test Member",
            date_of_birth=date(1990, 1, 1),
            gender="male",
            phone=phone,
        )
        db.add(profile)
    elif role == "trainer":
        profile = Trainer(id=user.id, full_name="Test Trainer")
        db.add(profile)
    elif role == "admin":
        profile = AdminStaff(id=user.id, full_name="Test Admin")
        db.add(profile)

    await db.commit()
    return user


async def create_room(db: AsyncSession, name: str = "Room A", capacity: int = 20) -> Room:
    room = Room(name=name, capacity=capacity)
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return room
