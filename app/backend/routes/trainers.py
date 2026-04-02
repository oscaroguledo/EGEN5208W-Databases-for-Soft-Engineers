from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from core.db import get_db
from core.auth import require_trainer, require_admin
from core.response import APIResponse, Pagination

from services.users.trainers import TrainerService
from models.users.user import User

router = APIRouter(prefix="/trainers", tags=["trainers"])

@router.post("/availability", response_model=APIResponse[dict])
async def set_trainer_availability(
    available_date: str,
    start_at: str,
    end_at: str,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db)
):
    """Set trainer availability"""
    from datetime import datetime, time, date
    
    date_obj = datetime.strptime(available_date, "%Y-%m-%d").date()
    start_time_obj = datetime.strptime(start_at, "%H:%M").time()
    end_time_obj = datetime.strptime(end_at, "%H:%M").time()
    
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

@router.get("/schedule-optimized", response_model=APIResponse[dict])
async def get_trainer_schedule_optimized(
    days_ahead: int = 7,
    current_user: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db)
):
    """Get trainer's schedule using database view for optimized performance"""
    schedule = await TrainerService.get_schedule_with_view(
        db=db,
        trainer_id=current_user.id,
        days_ahead=days_ahead
    )
    
    return APIResponse(
        status="success",
        message="Trainer schedule retrieved (optimized)",
        data=schedule,
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
        data=trainers,
        pagination=Pagination(
            total=total,
            page=(skip // limit) + 1,
            size=limit,
            total_pages=total_pages
        ),
        status_code=200
    )
