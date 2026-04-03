from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from pydantic import BaseModel

from core.db import get_db
from core.auth import require_trainer, require_admin, require_any_role
from core.response import APIResponse, Pagination

from services.users.trainers import TrainerService
from models.users.user import User

router = APIRouter(prefix="/trainers", tags=["trainers"])


class AvailabilityRequest(BaseModel):
    """Trainer availability request schema"""
    available_date: str  # "YYYY-MM-DD"
    start_at: str  # "HH:MM"
    end_at: str  # "HH:MM"


@router.get("/me", response_model=APIResponse[dict])
async def get_trainer_me(
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db)
):
    """Get the current trainer's own profile"""
    trainer = await TrainerService.get_trainer(db, current_user.id)
    if not trainer:
        return APIResponse.error(message="Trainer profile not found", status_code=404)
    return APIResponse(
        status="success",
        message="Trainer profile retrieved",
        data=trainer.to_dict(),
        status_code=200
    )


@router.get("/availability", response_model=APIResponse[List])
async def get_trainer_availability(
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db)
):
    """Get all availability slots for the current trainer"""
    from sqlalchemy.future import select as sa_select
    from models.trainings import TrainerAvailability as TrainerAvailabilityModel
    result = await db.execute(
        sa_select(TrainerAvailabilityModel)
        .where(TrainerAvailabilityModel.trainer_id == current_user.id)
        .order_by(TrainerAvailabilityModel.available_date, TrainerAvailabilityModel.start_at)
    )
    slots = result.scalars().all()
    return APIResponse(
        status="success",
        message="Availability retrieved",
        data=[s.to_dict() for s in slots],
        status_code=200
    )


@router.post("/availability", response_model=APIResponse[dict])
async def set_trainer_availability(
    data: AvailabilityRequest,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db)
):
    """Set trainer availability"""
    from datetime import datetime, time, date
    from sqlalchemy.future import select as sa_select
    from sqlalchemy import and_
    from models.trainings import TrainerAvailability as TrainerAvailabilityModel
    
    date_obj = datetime.strptime(data.available_date, "%Y-%m-%d").date()
    start_time_obj = datetime.strptime(data.start_at, "%H:%M").time()
    end_time_obj = datetime.strptime(data.end_at, "%H:%M").time()
    
    # Validate: end time must be after start time
    if end_time_obj <= start_time_obj:
        return APIResponse.error(
            message="End time must be after start time",
            status_code=400
        )
    
    # Check for overlapping availability slots
    overlap_query = sa_select(TrainerAvailabilityModel).where(
        and_(
            TrainerAvailabilityModel.trainer_id == current_user.id,
            TrainerAvailabilityModel.available_date == date_obj,
            TrainerAvailabilityModel.start_at < end_time_obj,
            TrainerAvailabilityModel.end_at > start_time_obj
        )
    )
    overlap_result = await db.execute(overlap_query)
    overlapping_slots = overlap_result.scalars().all()
    
    if overlapping_slots:
        return APIResponse.error(
            message="This time slot overlaps with existing availability",
            status_code=409
        )
    
    availability = await TrainerService.set_availability(
        db=db,
        trainer_id=current_user.id,
        available_date=date_obj,
        start_at=start_time_obj,
        end_at=end_time_obj
    )
    
    return APIResponse(
        status="success",
        message="Availability set successfully",
        data={"availability_id": str(availability.id)},
        status_code=201
    )

@router.put("/availability/{availability_id}", response_model=APIResponse[dict])
async def update_trainer_availability(
    availability_id: UUID,
    data: AvailabilityRequest,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db)
):
    """Update existing trainer availability slot"""
    from datetime import datetime, time, date
    from sqlalchemy.future import select as sa_select
    from sqlalchemy import and_
    from models.trainings import TrainerAvailability as TrainerAvailabilityModel
    
    # Check if slot exists and belongs to this trainer
    result = await db.execute(
        sa_select(TrainerAvailabilityModel).where(
            TrainerAvailabilityModel.id == availability_id,
            TrainerAvailabilityModel.trainer_id == current_user.id
        )
    )
    existing_slot = result.scalar_one_or_none()
    
    if not existing_slot:
        return APIResponse.error(
            message="Availability slot not found",
            status_code=404
        )
    
    date_obj = datetime.strptime(data.available_date, "%Y-%m-%d").date()
    # Handle HH:MM:SS format by truncating to HH:MM
    start_at_str = data.start_at[:5] if len(data.start_at) > 5 else data.start_at
    end_at_str = data.end_at[:5] if len(data.end_at) > 5 else data.end_at
    start_time_obj = datetime.strptime(start_at_str, "%H:%M").time()
    end_time_obj = datetime.strptime(end_at_str, "%H:%M").time()
    
    # Validate: end time must be after start time
    if end_time_obj <= start_time_obj:
        return APIResponse.error(
            message="End time must be after start time",
            status_code=400
        )
    
    # Check for overlapping slots (excluding this slot)
    overlap_query = sa_select(TrainerAvailabilityModel).where(
        and_(
            TrainerAvailabilityModel.trainer_id == current_user.id,
            TrainerAvailabilityModel.id != availability_id,
            TrainerAvailabilityModel.available_date == date_obj,
            TrainerAvailabilityModel.start_at < end_time_obj,
            TrainerAvailabilityModel.end_at > start_time_obj
        )
    )
    overlap_result = await db.execute(overlap_query)
    overlapping_slots = overlap_result.scalars().all()
    
    if overlapping_slots:
        return APIResponse.error(
            message="This time slot overlaps with existing availability",
            status_code=409
        )
    
    # Update the slot
    existing_slot.available_date = date_obj
    existing_slot.start_at = start_time_obj
    existing_slot.end_at = end_time_obj
    
    await db.commit()
    await db.refresh(existing_slot)
    
    return APIResponse(
        status="success",
        message="Availability updated successfully",
        data={"availability_id": str(existing_slot.id)},
        status_code=200
    )

@router.delete("/availability/{availability_id}", response_model=APIResponse[dict])
async def delete_trainer_availability(
    availability_id: UUID,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db)
):
    """Delete trainer availability slot"""
    from sqlalchemy.future import select as sa_select
    from models.trainings import TrainerAvailability as TrainerAvailabilityModel
    
    # Check if slot exists and belongs to this trainer
    result = await db.execute(
        sa_select(TrainerAvailabilityModel).where(
            TrainerAvailabilityModel.id == availability_id,
            TrainerAvailabilityModel.trainer_id == current_user.id
        )
    )
    existing_slot = result.scalar_one_or_none()
    
    if not existing_slot:
        return APIResponse.error(
            message="Availability slot not found",
            status_code=404
        )
    
    await db.delete(existing_slot)
    await db.commit()
    
    return APIResponse(
        status="success",
        message="Availability deleted successfully",
        data={"deleted_id": str(availability_id)},
        status_code=200
    )

@router.get("/schedule", response_model=APIResponse[dict])
async def get_trainer_schedule(
    days_ahead: int = 7,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db)
):
    """Get trainer's schedule"""
    schedule = await TrainerService.get_schedule_view(
        db=db,
        trainer_id=current_user.id,
        days_ahead=days_ahead
    )
    
    return APIResponse(
        status="success",
        message="Trainer schedule retrieved",
        data=schedule,
        status_code=200
    )

@router.get("/public", response_model=APIResponse[List])
async def list_trainers_public(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_any_role),
    db: AsyncSession = Depends(get_db)
):
    """List trainers — accessible to all authenticated users (for booking forms)"""
    trainers, total = await TrainerService.list_trainers(db=db, skip=skip, limit=limit)
    return APIResponse(
        status="success",
        message="Trainers list retrieved",
        data=[t.to_dict() for t in trainers],
        status_code=200
    )


@router.get("/list", response_model=APIResponse[List])
async def list_trainers(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(require_admin),  # Only admin can list all trainers
    db: AsyncSession = Depends(get_db)
):
    """List all trainers with pagination (admin only)"""
    trainers, total = await TrainerService.list_trainers(
        db=db,
        skip=skip,
        limit=limit
    )
    
    total_pages = (total + limit - 1) // limit if limit > 0 else 1
    
    return APIResponse(
        status="success",
        message="Trainers list retrieved with pagination",
        data=[t.to_dict() for t in trainers],
        pagination=Pagination(
            total=total,
            page=(skip // limit) + 1,
            size=limit,
            total_pages=total_pages
        ),
        status_code=200
    )
