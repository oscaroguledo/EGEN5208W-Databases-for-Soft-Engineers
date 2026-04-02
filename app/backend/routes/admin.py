from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

from core.db import get_db
from core.auth import require_admin
from core.response import APIResponse, Pagination

from services.users.admin_staff import AdminStaffService
from models.users.user import User

router = APIRouter(prefix="/admin", tags=["admin"])


class CreateClassRequest(BaseModel):
    """Create class request schema"""
    name: str
    trainer_id: UUID
    room_id: UUID
    class_date: str  # "YYYY-MM-DD"
    start_time: str  # "HH:MM"
    end_time: str  # "HH:MM"
    max_capacity: int = 20


@router.post("/classes", response_model=APIResponse[dict])
async def create_class(
    data: CreateClassRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new group fitness class"""
    from datetime import datetime, time
    
    date_obj = datetime.strptime(data.class_date, "%Y-%m-%d").date()
    start_time_obj = datetime.strptime(data.start_time, "%H:%M").time()
    end_time_obj = datetime.strptime(data.end_time, "%H:%M").time()
    
    try:
        new_class = await AdminStaffService.schedule_class_with_room(
            db=db,
            class_name=data.name,
            trainer_id=data.trainer_id,
            room_id=data.room_id,
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

class AssignRoomRequest(BaseModel):
    """Assign room to session request"""
    room_id: UUID


@router.put("/sessions/{session_id}/room", response_model=APIResponse[dict])
async def assign_room_to_session(
    session_id: UUID,
    data: AssignRoomRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Assign room to training session"""
    try:
        session = await AdminStaffService.book_room_for_session(
            db=db,
            session_id=session_id,
            room_id=data.room_id
        )
        
        return APIResponse(
            status="success",
            message="Room assigned to session",
            data={"session_id": str(session.id), "room_id": str(data.room_id)},
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
    skip: int = 0,
    limit: int = 20,
    status_filter: str = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """View all equipment with pagination (admin only)"""
    equipment_list, total = await AdminStaffService.list_equipments(
        db=db,
        skip=skip,
        limit=limit,
        status=status_filter
    )
    
    total_pages = (total + limit - 1) // limit if limit > 0 else 1
    
    return APIResponse(
        status="success",
        message="Equipment list retrieved with pagination",
        data=equipment_list,
        pagination=Pagination(
            total=total,
            page=(skip // limit) + 1,
            size=limit,
            total_pages=total_pages
        ),
        status_code=200
    )

@router.get("/equipment/list", response_model=APIResponse[List])
async def list_equipment_paginated(
    skip: int = 0,
    limit: int = 20,
    status_filter: str = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all equipment with pagination (admin only)"""
    equipment_list, total = await AdminStaffService.list_equipments(
        db=db,
        skip=skip,
        limit=limit,
        status=status_filter
    )
    
    total_pages = (total + limit - 1) // limit if limit > 0 else 1
    
    return APIResponse(
        status="success",
        message="Equipment list retrieved with pagination",
        data=equipment_list,
        pagination=Pagination(
            total=total,
            page=(skip // limit) + 1,
            size=limit,
            total_pages=total_pages
        ),
        status_code=200
    )

class EquipmentStatusRequest(BaseModel):
    """Equipment status update request"""
    status: str
    notes: Optional[str] = None


@router.put("/equipment/{equipment_id}/status", response_model=APIResponse[dict])
async def update_equipment_status(
    equipment_id: UUID,
    data: EquipmentStatusRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update equipment maintenance status"""
    from models.equipments import EquipmentStatus
    
    try:
        status_enum = EquipmentStatus(data.status)
        equipment = await AdminStaffService.update_equipment_maintenance(
            db=db,
            equipment_id=equipment_id,
            status=status_enum,
            notes=data.notes
        )
        
        if not equipment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Equipment not found"
            )
        
        return APIResponse(
            status="success",
            message="Equipment status updated",
            data={"equipment_id": str(equipment.id), "status": data.status},
            status_code=200
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid equipment status"
        )

@router.get("/equipment/status-options", response_model=APIResponse[List[dict]])
async def get_equipment_status_options(
    current_user: User = Depends(require_admin)
):
    """Get available equipment status options"""
    from models.equipments import EquipmentStatus
    
    status_options = [
        {"value": EquipmentStatus.operational.value, "label": "Operational"},
        {"value": EquipmentStatus.under_repair.value, "label": "Under Repair"},
        {"value": EquipmentStatus.out_of_service.value, "label": "Out of Service"}
    ]
    
    return APIResponse(
        status="success",
        message="Equipment status options retrieved",
        data=status_options,
        status_code=200
    )

class CreateEquipmentRequest(BaseModel):
    """Create equipment request"""
    equipment_name: str
    room_id: UUID
    status: str = "operational"
    notes: Optional[str] = None


@router.post("/equipment", response_model=APIResponse[dict])
async def create_equipment(
    data: CreateEquipmentRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create new equipment"""
    from models.equipments import EquipmentStatus
    from services.equipments import EquipmentService
    
    try:
        status_enum = EquipmentStatus(data.status)
        new_equipment = await EquipmentService.create_equipment(
            db=db,
            room_id=data.room_id,
            equipment_name=data.equipment_name,
            status=status_enum
        )
        
        # Update notes if provided
        if data.notes:
            await EquipmentService.update_equipment(
                db=db,
                equipment_id=new_equipment.id,
                maintenance_notes=data.notes
            )
        
        return APIResponse(
            status="success",
            message="Equipment created successfully",
            data={
                "equipment_id": str(new_equipment.id),
                "equipment_name": new_equipment.equipment_name
            },
            status_code=201
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

class UpdateEquipmentRequest(BaseModel):
    """Update equipment request"""
    equipment_name: Optional[str] = None
    room_id: Optional[UUID] = None
    status: Optional[str] = None
    notes: Optional[str] = None


@router.put("/equipment/{equipment_id}", response_model=APIResponse[dict])
async def update_equipment(
    equipment_id: UUID,
    data: UpdateEquipmentRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update equipment details"""
    from models.equipments import EquipmentStatus
    from services.equipments import EquipmentService
    
    try:
        # Build update data dict
        update_data = {}
        if data.equipment_name:
            update_data["equipment_name"] = data.equipment_name
        if data.room_id:
            update_data["room_id"] = data.room_id
        if data.status:
            status_enum = EquipmentStatus(data.status)
            update_data["status"] = status_enum
        if data.notes is not None:
            update_data["maintenance_notes"] = data.notes
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
        
        equipment = await EquipmentService.update_equipment(
            db=db,
            equipment_id=equipment_id,
            **update_data
        )
        
        if not equipment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Equipment not found"
            )
        
        return APIResponse(
            status="success",
            message="Equipment updated successfully",
            data={"equipment_id": str(equipment.id)},
            status_code=200
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/equipment/{equipment_id}", response_model=APIResponse[dict])
async def delete_equipment(
    equipment_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete equipment (soft delete)"""
    from services.equipments import EquipmentService
    
    success = await EquipmentService.soft_delete_equipment(
        db=db,
        equipment_id=equipment_id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    
    return APIResponse(
        status="success",
        message="Equipment deleted successfully",
        data={"equipment_id": str(equipment_id)},
        status_code=200
    )

@router.get("/sessions/list", response_model=APIResponse[List])
async def list_training_sessions(
    skip: int = 0,
    limit: int = 20,
    member_id: UUID = None,
    trainer_id: UUID = None,
    status_filter: str = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """List training sessions with pagination (admin only)"""
    sessions, total = await AdminStaffService.list_sessions(
        db=db,
        skip=skip,
        limit=limit,
        member_id=member_id,
        trainer_id=trainer_id,
        status=status_filter
    )
    
    total_pages = (total + limit - 1) // limit if limit > 0 else 1
    
    return APIResponse(
        status="success",
        message="Training sessions list retrieved with pagination",
        data=sessions,
        pagination=Pagination(
            total=total,
            page=(skip // limit) + 1,
            size=limit,
            total_pages=total_pages
        ),
        status_code=200
    )

@router.get("/payments/list", response_model=APIResponse[List])
async def list_payments(
    skip: int = 0,
    limit: int = 20,
    member_id: UUID = None,
    subscription_id: UUID = None,
    status_filter: str = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """List payments with pagination (admin only)"""
    payments, total = await AdminStaffService.list_payments(
        db=db,
        skip=skip,
        limit=limit,
        member_id=member_id,
        subscription_id=subscription_id,
        status=status_filter
    )
    
    total_pages = (total + limit - 1) // limit if limit > 0 else 1
    
    return APIResponse(
        status="success",
        message="Payments list retrieved with pagination",
        data=payments,
        pagination=Pagination(
            total=total,
            page=(skip // limit) + 1,
            size=limit,
            total_pages=total_pages
        ),
        status_code=200
    )
