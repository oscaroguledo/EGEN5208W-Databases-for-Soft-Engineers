from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

from core.db import get_db
from core.auth import require_member, require_admin, require_any_role
from core.response import APIResponse, Pagination
from models.users.user import User, UserRole
from services.users.members import MemberService

router = APIRouter(prefix="/members", tags=["members"])


# ── request bodies ─────────────────────────────────────────────────────────

class RegisterMemberBody(BaseModel):
    email: str
    password: str
    full_name: str
    date_of_birth: str   # "YYYY-MM-DD"
    gender: str
    phone: str


class UpdateMemberBody(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None


# ── routes ─────────────────────────────────────────────────────────────────

@router.post("/register", response_model=APIResponse[dict])
async def register_member(
    body: RegisterMemberBody,
    db: AsyncSession = Depends(get_db),
):
    """Register a new member (public endpoint)."""
    from datetime import date
    try:
        date_obj = datetime.strptime(body.date_of_birth, "%Y-%m-%d").date()
        member = await MemberService.register_member(
            db=db,
            email=body.email,
            password=body.password,
            full_name=body.full_name,
            date_of_birth=date_obj,
            gender=body.gender,
            phone=body.phone,
        )
        return APIResponse.success(data=member.to_dict(), message="Member registered successfully.", status_code=201)
    except ValueError as e:
        return APIResponse.error(
            message=str(e),
            status_code=400
        )
    except Exception as e:
        err = str(e).lower()
        if "unique" in err or "duplicate" in err or "already exists" in err:
            return APIResponse.error(
                message="An account with this email already exists.",
                status_code=400
            )
        return APIResponse.error(
            message="Registration failed. Please check your details and try again.",
            status_code=400
        )


@router.get("/me", response_model=APIResponse[dict])
async def get_current_member(
    current_user: User = Depends(require_member),
    db: AsyncSession = Depends(get_db),
):
    member = await MemberService.get_member(db, current_user.id)
    if not member:
        return APIResponse.error(message="Member profile not found", status_code=404)
    return APIResponse.success(data=member.to_dict(), message="Member profile retrieved.")


@router.put("/me", response_model=APIResponse[dict])
async def update_current_member(
    body: UpdateMemberBody,
    current_user: User = Depends(require_member),
    db: AsyncSession = Depends(get_db),
):
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    member = await MemberService.update_member(db, current_user.id, **update_data)
    if not member:
        return APIResponse.error(message="Member profile not found", status_code=404)
    return APIResponse.success(data=member.to_dict(), message="Member profile updated.")


@router.post("/goals", response_model=APIResponse[list])
async def update_fitness_goals(
    goals_data: List[dict],
    current_user: User = Depends(require_member),
    db: AsyncSession = Depends(get_db),
):
    goals = await MemberService.update_profile_goals(db=db, member_id=current_user.id, goals_data=goals_data)
    return APIResponse.success(data=[g.to_dict() for g in goals], message="Fitness goals updated.")


@router.get("/goals/list", response_model=APIResponse[list])
async def list_fitness_goals(
    skip: int = 0,
    limit: int = 20,
    member_id: Optional[UUID] = None,
    current_user: User = Depends(require_member),
    db: AsyncSession = Depends(get_db),
):
    target_id = member_id if current_user.role == UserRole.admin else current_user.id
    goals, total = await MemberService.list_fitness_goals(db, target_id, skip, limit)
    total_pages = (total + limit - 1) // limit if limit > 0 else 1
    return APIResponse(
        status="success",
        message="Fitness goals retrieved.",
        data=[g.to_dict() for g in goals],
        pagination=Pagination(total=total, page=(skip // limit) + 1, size=limit, total_pages=total_pages),
        status_code=200,
    )


@router.get("/health-history", response_model=APIResponse[list])
async def get_health_history(
    skip: int = 0,
    limit: int = 100,
    metric_type: Optional[str] = None,
    current_user: User = Depends(require_member),
    db: AsyncSession = Depends(get_db),
):
    metrics, total = await MemberService.get_health_metrics(
        db=db, member_id=current_user.id, metric_type=metric_type, skip=skip, limit=limit
    )
    total_pages = (total + limit - 1) // limit if limit > 0 else 1
    return APIResponse(
        status="success",
        message="Health history retrieved.",
        data=[m.to_dict() for m in metrics],
        pagination=Pagination(total=total, page=(skip // limit) + 1, size=limit, total_pages=total_pages),
        status_code=200,
    )


@router.post("/health-metrics", response_model=APIResponse[dict])
async def add_health_metric(
    metric_type: str,
    metric_value: float,
    current_user: User = Depends(require_member),
    db: AsyncSession = Depends(get_db),
):
    metric = await MemberService.add_health_metric(
        db=db,
        member_id=current_user.id,
        metric_type=metric_type,
        metric_value=metric_value,
        recorded_at=datetime.utcnow(),
    )
    return APIResponse.success(data={"metric_id": str(metric.id)}, message="Health metric recorded.", status_code=201)


@router.get("/classes/available", response_model=APIResponse[list])
async def list_available_classes(
    skip: int = 0,
    limit: int = 100,
    class_date: Optional[str] = None,
    current_user: User = Depends(require_member),
    db: AsyncSession = Depends(get_db),
):
    date_obj = None
    if class_date:
        date_obj = datetime.strptime(class_date, "%Y-%m-%d").date()
    classes, total = await MemberService.list_available_classes(db=db, skip=skip, limit=limit, class_date=date_obj)
    total_pages = (total + limit - 1) // limit if limit > 0 else 1
    return APIResponse(
        status="success",
        message="Available classes retrieved.",
        data=[c.to_dict() for c in classes],
        pagination=Pagination(total=total, page=(skip // limit) + 1, size=limit, total_pages=total_pages),
        status_code=200,
    )


@router.post("/enroll-class/{class_id}", response_model=APIResponse[dict])
async def enroll_in_class(
    class_id: UUID,
    current_user: User = Depends(require_member),
    db: AsyncSession = Depends(get_db),
):
    try:
        enrollment = await MemberService.enroll_in_class(db=db, member_id=current_user.id, class_id=class_id)
        return APIResponse.success(data={"enrollment_id": str(enrollment.id)}, message="Enrolled in class.", status_code=201)
    except ValueError as e:
        return APIResponse.error(message=str(e), status_code=400)


@router.delete("/enroll-class/{class_id}", response_model=APIResponse[dict])
async def cancel_class_enrollment(
    class_id: UUID,
    current_user: User = Depends(require_member),
    db: AsyncSession = Depends(get_db),
):
    success = await MemberService.cancel_class_enrollment(db=db, member_id=current_user.id, class_id=class_id)
    if not success:
        return APIResponse.error(message="Enrollment not found", status_code=404)
    return APIResponse.success(data={"cancelled": True}, message="Class enrollment cancelled.")


@router.post("/book-session", response_model=APIResponse[dict])
async def book_training_session(
    trainer_id: UUID,
    room_id: UUID,
    session_date: str,
    start_time: str,
    end_time: str,
    member_id: Optional[UUID] = None,
    current_user: User = Depends(require_any_role),
    db: AsyncSession = Depends(get_db),
):
    # Admins must supply an explicit member_id; members use their own id
    if current_user.role == UserRole.admin:
        if not member_id:
            return APIResponse.error(message="member_id is required when booking on behalf of a member.", status_code=400)
        resolved_member_id = member_id
    else:
        resolved_member_id = current_user.id

    date_obj = datetime.strptime(session_date, "%Y-%m-%d").date()
    start_obj = datetime.strptime(start_time, "%H:%M").time()
    end_obj = datetime.strptime(end_time, "%H:%M").time()
    try:
        session = await MemberService.book_training_session(
            db=db,
            member_id=resolved_member_id,
            trainer_id=trainer_id,
            room_id=room_id,
            session_date=date_obj,
            start_time=start_obj,
            end_time=end_obj,
        )
        return APIResponse.success(data=session.to_dict(), message="Training session booked.", status_code=201)
    except ValueError as e:
        return APIResponse.error(message=str(e), status_code=400)
    except Exception as e:
        return APIResponse.error(message="Failed to book session. Please try again.", status_code=500)


@router.delete("/book-session/{session_id}", response_model=APIResponse[dict])
async def cancel_training_session(
    session_id: UUID,
    current_user: User = Depends(require_member),
    db: AsyncSession = Depends(get_db),
):
    success = await MemberService.cancel_training_session(db=db, member_id=current_user.id, session_id=session_id)
    if not success:
        return APIResponse.error(message="Session not found or cannot be cancelled", status_code=404)
    return APIResponse.success(data={"cancelled": True}, message="Training session cancelled.")


@router.get("/dashboard", response_model=APIResponse[dict])
async def get_member_dashboard(
    days_ahead: int = 30,
    current_user: User = Depends(require_member),
    db: AsyncSession = Depends(get_db),
):
    schedule = await MemberService.get_dashboard_schedule(db=db, member_id=current_user.id, days_ahead=days_ahead)
    return APIResponse.success(data=schedule, message="Dashboard data retrieved.")


@router.get("/list", response_model=APIResponse[list])
async def list_members(
    skip: int = 0,
    limit: int = 20,
    gender: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    members, total = await MemberService.list_members(db=db, skip=skip, limit=limit, gender=gender)
    total_pages = (total + limit - 1) // limit if limit > 0 else 1
    return APIResponse(
        status="success",
        message="Members list retrieved.",
        data=[m.to_dict() for m in members],
        pagination=Pagination(total=total, page=(skip // limit) + 1, size=limit, total_pages=total_pages),
        status_code=200,
    )
