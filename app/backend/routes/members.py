from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from core.db import get_db
from core.auth import require_member, PermissionChecker
from core.response import APIResponse

from services.users.members import MemberService
from models.users.user import User
from models.users.members import Member

router = APIRouter(prefix="/members", tags=["members"])

@router.post("/register", response_model=APIResponse[Member])
async def register_member(
    email: str,
    password: str,
    full_name: str,
    date_of_birth: str,
    gender: str,
    phone: str,
    db: AsyncSession = Depends(get_db)
):
    """Register a new member"""
    from datetime import datetime
    date_obj = datetime.strptime(date_of_birth, "%Y-%m-%d").date()
    
    member = await MemberService.register_member(
        db=db,
        email=email,
        password=password,
        full_name=full_name,
        date_of_birth=date_obj,
        gender=gender,
        phone=phone
    )
    
    return APIResponse(
        status="success",
        message="Member registered successfully",
        data=member,
        status_code=201
    )

@router.get("/me", response_model=APIResponse[Member])
async def get_current_member(
    current_user: User = Depends(require_member),
    db: AsyncSession = Depends(get_db)
):
    """Get current member's profile"""
    member = await MemberService.get_member(db, current_user.id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member profile not found"
        )
    
    return APIResponse(
        status="success",
        message="Member profile retrieved",
        data=member,
        status_code=200
    )

@router.put("/me", response_model=APIResponse[Member])
async def update_current_member(
    full_name: str = None,
    phone: str = None,
    current_user: User = Depends(require_member),
    db: AsyncSession = Depends(get_db)
):
    """Update current member's profile"""
    update_data = {}
    if full_name:
        update_data["full_name"] = full_name
    if phone:
        update_data["phone"] = phone
    
    member = await MemberService.update_member(db, current_user.id, **update_data)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member profile not found"
        )
    
    return APIResponse(
        status="success",
        message="Member profile updated",
        data=member,
        status_code=200
    )

@router.post("/goals", response_model=APIResponse[List])
async def update_fitness_goals(
    goals_data: List[dict],
    current_user: User = Depends(require_member),
    db: AsyncSession = Depends(get_db)
):
    """Update member's fitness goals"""
    goals = await MemberService.update_profile_goals(
        db=db,
        member_id=current_user.id,
        goals_data=goals_data
    )
    
    return APIResponse(
        status="success",
        message="Fitness goals updated",
        data=goals,
        status_code=200
    )

@router.get("/health-history", response_model=APIResponse[List])
async def get_health_history(
    metric_type: str = None,
    limit: int = 100,
    current_user: User = Depends(require_member),
    db: AsyncSession = Depends(get_db)
):
    """Get member's health metrics history"""
    # Check permission
    if not PermissionChecker.can_view_health_metrics(current_user, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    metrics = await MemberService.get_health_history(
        db=db,
        member_id=current_user.id,
        metric_type=metric_type,
        limit=limit
    )
    
    return APIResponse(
        status="success",
        message="Health history retrieved",
        data=metrics,
        status_code=200
    )

@router.get("/list", response_model=APIResponse[List])
async def list_members(
    skip: int = 0,
    limit: int = 20,
    gender: str = None,
    current_user: User = Depends(require_admin),  # Only admin can list all members
    db: AsyncSession = Depends(get_db)
):
    """List all members with pagination (admin only)"""
    members = await MemberService.list_members(
        db=db,
        skip=skip,
        limit=limit,
        gender=gender
    )
    
    return APIResponse(
        status="success",
        message="Members list retrieved",
        data=members,
        status_code=200
    )

@router.get("/dashboard-optimized", response_model=APIResponse[dict])
async def get_member_dashboard_optimized(
    days_ahead: int = 30,
    current_user: User = Depends(require_member),
    db: AsyncSession = Depends(get_db)
):
    """Get member's dashboard using database view for optimized performance"""
    dashboard = await MemberService.get_dashboard_with_view(
        db=db,
        member_id=current_user.id
    )
    
    return APIResponse(
        status="success",
        message="Dashboard data retrieved (optimized)",
        data=dashboard,
        status_code=200
    )

@router.get("/dashboard", response_model=APIResponse[dict])
async def get_member_dashboard(
    days_ahead: int = 30,
    current_user: User = Depends(require_member),
    db: AsyncSession = Depends(get_db)
):
    """Get member's dashboard with upcoming schedule"""
    schedule = await MemberService.get_dashboard_schedule(
        db=db,
        member_id=current_user.id,
        days_ahead=days_ahead
    )
    
    return APIResponse(
        status="success",
        message="Dashboard data retrieved",
        data=schedule,
        status_code=200
    )

@router.post("/enroll-class/{class_id}", response_model=APIResponse[dict])
async def enroll_in_class(
    class_id: UUID,
    current_user: User = Depends(require_member),
    db: AsyncSession = Depends(get_db)
):
    """Enroll member in a class"""
    try:
        enrollment = await MemberService.enroll_in_class(
            db=db,
            member_id=current_user.id,
            class_id=class_id
        )
        
        return APIResponse(
            status="success",
            message="Successfully enrolled in class",
            data={"enrollment_id": str(enrollment.id)},
            status_code=201
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/enroll-class/{class_id}", response_model=APIResponse[dict])
async def cancel_class_enrollment(
    class_id: UUID,
    current_user: User = Depends(require_member),
    db: AsyncSession = Depends(get_db)
):
    """Cancel class enrollment"""
    success = await MemberService.cancel_class_enrollment(
        db=db,
        member_id=current_user.id,
        class_id=class_id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found"
        )
    
    return APIResponse(
        status="success",
        message="Class enrollment cancelled",
        data={"cancelled": True},
        status_code=200
    )

@router.post("/book-session", response_model=APIResponse[dict])
async def book_training_session(
    trainer_id: UUID,
    room_id: UUID,
    session_date: str,
    start_time: str,
    end_time: str,
    current_user: User = Depends(require_member),
    db: AsyncSession = Depends(get_db)
):
    """Book a personal training session"""
    from datetime import datetime, time
    
    date_obj = datetime.strptime(session_date, "%Y-%m-%d").date()
    start_time_obj = datetime.strptime(start_time, "%H:%M").time()
    end_time_obj = datetime.strptime(end_time, "%H:%M").time()
    
    try:
        session = await MemberService.book_training_session(
            db=db,
            member_id=current_user.id,
            trainer_id=trainer_id,
            room_id=room_id,
            session_date=date_obj,
            start_time=start_time_obj,
            end_time=end_time_obj
        )
        
        return APIResponse(
            status="success",
            message="Training session booked successfully",
            data={"session_id": str(session.id)},
            status_code=201
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/health-metrics", response_model=APIResponse[dict])
async def add_health_metric(
    metric_type: str,
    metric_value: float,
    current_user: User = Depends(require_member),
    db: AsyncSession = Depends(get_db)
):
    """Add a new health metric record (append-only)"""
    from datetime import datetime
    
    metric = await MemberService.add_health_metric(
        db=db,
        member_id=current_user.id,
        metric_type=metric_type,
        metric_value=metric_value,
        recorded_at=datetime.utcnow()
    )
    
    return APIResponse(
        status="success",
        message="Health metric recorded",
        data={"metric_id": str(metric.id)},
        status_code=201
    )

@router.delete("/book-session/{session_id}", response_model=APIResponse[dict])
async def cancel_training_session(
    session_id: UUID,
    current_user: User = Depends(require_member),
    db: AsyncSession = Depends(get_db)
):
    """Cancel a training session"""
    success = await MemberService.cancel_training_session(
        db=db,
        member_id=current_user.id,
        session_id=session_id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or cannot be cancelled"
        )
    
    return APIResponse(
        status="success",
        message="Training session cancelled",
        data={"cancelled": True},
        status_code=200
    )
