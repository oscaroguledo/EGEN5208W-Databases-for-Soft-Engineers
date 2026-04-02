from fastapi import APIRouter, Depends, HTTPException, status
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trainer profile not found")
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
    
    date_obj = datetime.strptime(data.available_date, "%Y-%m-%d").date()
    start_time_obj = datetime.strptime(data.start_at, "%H:%M").time()
    end_time_obj = datetime.strptime(data.end_at, "%H:%M").time()
    
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
