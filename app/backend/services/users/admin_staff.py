from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete, and_, or_, func, text
from uuid import UUID
from datetime import datetime, date, time, timedelta

from models.trainings import TrainingSession, Room, Class
from models.equipments import Equipment, EquipmentStatus
from models.users.admin_staff import AdminStaff
from models.users.user import User, UserRole
from core.encryption import PasswordManager

class AdminStaffService:
    """
    Enhanced service layer for Admin operations
    """

    @staticmethod
    async def book_room_for_session(
        db: AsyncSession,
        session_id: UUID,
        room_id: UUID,
        check_conflicts: bool = True
    ) -> Optional[TrainingSession]:
        """
        Room Booking: UPDATE Sessions SET room_id = $1 ... (Trigger handles errors)
        Includes conflict checking to prevent double bookings
        """
        if check_conflicts:
            # Check for scheduling conflicts
            session_query = select(TrainingSession).where(TrainingSession.id == session_id)
            session_result = await db.execute(session_query)
            session = session_result.scalar_one_or_none()
            
            if not session:
                return None
            
            # Check for existing sessions in the same room at the same time
            conflict_query = (
                select(TrainingSession)
                .where(
                    and_(
                        TrainingSession.room_id == room_id,
                        TrainingSession.session_date == session.session_date,
                        TrainingSession.status == "scheduled",
                        or_(
                            and_(
                                TrainingSession.start_time <= session.start_time,
                                TrainingSession.end_time > session.start_time
                            ),
                            and_(
                                TrainingSession.start_time < session.end_time,
                                TrainingSession.end_time >= session.end_time
                            ),
                            and_(
                                TrainingSession.start_time >= session.start_time,
                                TrainingSession.end_time <= session.end_time
                            )
                        ),
                        TrainingSession.id != session_id
                    )
                )
            )
            
            conflict_result = await db.execute(conflict_query)
            conflicts = conflict_result.scalars().all()
            
            if conflicts:
                raise ValueError(f"Room {room_id} is already booked during this time slot")
        
        # Update the session with the room
        query = (
            update(TrainingSession)
            .where(TrainingSession.id == session_id)
            .values(room_id=room_id, updated_at=datetime.utcnow())
            .returning(TrainingSession)
        )
        
        result = await db.execute(query)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def schedule_class_with_room(
        db: AsyncSession,
        class_name: str,
        trainer_id: UUID,
        room_id: UUID,
        class_date: date,
        start_time: time,
        end_time: time
    ) -> Class:
        """
        Schedule a new class with room conflict checking
        """
        # Check for room conflicts
        conflict_query = (
            select(Class)
            .where(
                and_(
                    Class.room_id == room_id,
                    Class.class_date == class_date,
                    Class.deleted_at.is_(None),
                    or_(
                        and_(
                            Class.start_time <= start_time,
                            Class.end_time > start_time
                        ),
                        and_(
                            Class.start_time < end_time,
                            Class.end_time >= end_time
                        ),
                        and_(
                            Class.start_time >= start_time,
                            Class.end_time <= end_time
                        )
                    )
                )
            )
        )
        
        conflict_result = await db.execute(conflict_query)
        conflicts = conflict_result.scalars().all()
        
        if conflicts:
            raise ValueError(f"Room {room_id} is already booked during this time slot")
        
        # Create the class
        new_class = Class(
            name=class_name,
            trainer_id=trainer_id,
            room_id=room_id,
            class_date=class_date,
            start_time=start_time,
            end_time=end_time,
            created_at=datetime.utcnow()
        )
        
        db.add(new_class)
        await db.commit()
        await db.refresh(new_class)
        
        return new_class

    @staticmethod
    async def update_equipment_maintenance(
        db: AsyncSession,
        equipment_id: UUID,
        status: EquipmentStatus = EquipmentStatus.under_repair,
        notes: Optional[str] = None
    ) -> Optional[Equipment]:
        """
        Equipment Maintenance: UPDATE Equipment SET status = 'under repair' WHERE equipment_id = $1
        """
        query = (
            update(Equipment)
            .where(Equipment.id == equipment_id, Equipment.deleted_at.is_(None))
            .values(
                status=status,
                updated_at=datetime.utcnow(),
                maintenance_notes=notes if notes else Equipment.maintenance_notes
            )
            .returning(Equipment)
        )
        
        result = await db.execute(query)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def get_equipment_with_view(
        db: AsyncSession,
        status_filter: str = None
    ) -> list:
        """
        Get equipment list using database view for optimized performance
        """
        from sqlalchemy import text
        
        # Use the equipment_maintenance_view for optimized query
        query = text("""
            SELECT 
                equipment_id,
                equipment_name,
                status,
                maintenance_notes,
                updated_at,
                room_name,
                room_capacity,
                maintenance_status
            FROM equipment_maintenance_view
        """)
        
        params = {}
        if status_filter:
            query += text(" WHERE status = :status_filter")
            params["status_filter"] = status_filter
        
        query += text(" ORDER BY maintenance_status, room_name, equipment_name")
        
        result = await db.execute(query, params)
        rows = result.fetchall()
        
        # Process the results
        equipment_list = []
        for row in rows:
            equipment_list.append({
                "equipment_id": str(row.equipment_id),
                "equipment_name": row.equipment_name,
                "status": row.status,
                "maintenance_notes": row.maintenance_notes,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None,
                "room_name": row.room_name,
                "room_capacity": row.room_capacity,
                "maintenance_status": row.maintenance_status
            })
        
        return equipment_list

    @staticmethod
    async def get_admin(db: AsyncSession, admin_id: UUID) -> Optional[AdminStaff]:
        """
        Fetch a single admin staff by ID
        """
        result = await db.execute(
            select(AdminStaff).where(AdminStaff.id == admin_id, AdminStaff.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_admins(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[AdminStaff]:
        """
        List all admin staff with pagination
        """
        query = select(AdminStaff).where(AdminStaff.deleted_at.is_(None)).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def create_admin(
        db: AsyncSession,
        email: str,
        password: str,
        full_name: str
    ) -> AdminStaff:
        """
        Create a new admin staff along with the linked User
        """
        from core.encryption import PasswordManager

        # 1️⃣ Hash the password
        hashed_password = await PasswordManager.hash_password(password)

        # 2️⃣ Create the User
        new_user = User(
            email=email,
            password=hashed_password,
            role=UserRole.admin
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        # 3️⃣ Create the AdminStaff profile
        new_admin = AdminStaff(
            id=new_user.id,
            full_name=full_name,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(new_admin)
        await db.commit()
        await db.refresh(new_admin)

        return new_admin

    @staticmethod
    async def update_admin(db: AsyncSession, admin_id: UUID, **data) -> Optional[AdminStaff]:
        """
        Update admin staff fields
        """
        query = (
            update(AdminStaff)
            .where(AdminStaff.id == admin_id, AdminStaff.deleted_at.is_(None))
            .values(**data, updated_at=datetime.utcnow())
            .returning(AdminStaff)
        )
        result = await db.execute(query)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def soft_delete_admin(db: AsyncSession, admin_id: UUID) -> bool:
        """
        Soft-delete an admin staff (mark deleted_at)
        """
        result = await db.execute(
            update(AdminStaff)
            .where(AdminStaff.id == admin_id, AdminStaff.deleted_at.is_(None))
            .values(deleted_at=datetime.utcnow())
        )
        await db.commit()
        return result.rowcount > 0

    @staticmethod
    async def hard_delete_admin(db: AsyncSession, admin_id: UUID) -> bool:
        """
        Permanently delete an admin staff
        """
        result = await db.execute(delete(AdminStaff).where(AdminStaff.id == admin_id))
        await db.commit()
        return result.rowcount > 0