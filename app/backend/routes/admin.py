from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from core.db import get_db
from core.auth import require_admin
from core.response import APIResponse

from services.users.admin_staff import AdminStaffService
from models.users.user import User

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/classes", response_model=APIResponse[dict])
async def create_class(
    name: str,
    trainer_id: UUID,
    room_id: UUID,
    class_date: str,
    start_time: str,
    end_time: str,
    max_capacity: int = 20,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new group fitness class"""
    from datetime import datetime, time
    
    date_obj = datetime.strptime(class_date, "%Y-%m-%d").date()
    start_time_obj = datetime.strptime(start_time, "%H:%M").time()
    end_time_obj = datetime.strptime(end_time, "%H:%M").time()
    
    try:
        new_class = await AdminStaffService.schedule_class_with_room(
            db=db,
            class_name=name,
            trainer_id=trainer_id,
            room_id=room_id,
            class_date=date_obj,
            start_time=start_time_obj,
            end_time=end_time_obj
        )
        
        return APIResponse(
            status="success",
            message="Class created successfully",
            data={"class_id": str(new_class.id)},
            status_code=201
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/sessions/{session_id}/room", response_model=APIResponse[dict])
async def assign_room_to_session(
    session_id: UUID,
    room_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Assign room to training session"""
    try:
        session = await AdminStaffService.book_room_for_session(
            db=db,
            session_id=session_id,
            room_id=room_id
        )
        
        return APIResponse(
            status="success",
            message="Room assigned to session",
            data={"session_id": str(session.id), "room_id": str(room_id)},
            status_code=200
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/equipment-optimized", response_model=APIResponse[List])
async def get_all_equipment_optimized(
    status_filter: str = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """View all equipment using database view for optimized performance"""
    equipment_list = await AdminStaffService.get_equipment_with_view(
        db=db,
        status_filter=status_filter
    )
    
    return APIResponse(
        status="success",
        message="Equipment list retrieved (optimized)",
        data=equipment_list,
        status_code=200
    )

@router.get("/equipment", response_model=APIResponse[List])
async def get_all_equipment(
    status_filter: str = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """View all equipment, optionally filter by maintenance status"""
    from models.equipments import Equipment, EquipmentStatus
    from sqlalchemy.future import select
    
    query = select(Equipment).where(Equipment.deleted_at.is_(None))
    
    if status_filter:
        try:
            status_enum = EquipmentStatus(status_filter)
            query = query.where(Equipment.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid equipment status"
            )
    
    result = await db.execute(query)
    equipment_list = result.scalars().all()
    
    return APIResponse(
        status="success",
        message="Equipment list retrieved",
        data=equipment_list,
        status_code=200
    )

@router.put("/equipment/{equipment_id}/status", response_model=APIResponse[dict])
async def update_equipment_status(
    equipment_id: UUID,
    status: str,
    notes: str = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update equipment maintenance status"""
    from models.equipments import EquipmentStatus
    
    try:
        status_enum = EquipmentStatus(status)
        equipment = await AdminStaffService.update_equipment_maintenance(
            db=db,
            equipment_id=equipment_id,
            status=status_enum,
            notes=notes
        )
        
        if not equipment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Equipment not found"
            )
        
        return APIResponse(
            status="success",
            message="Equipment status updated",
            data={"equipment_id": str(equipment.id), "status": status},
            status_code=200
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid equipment status"
        )
