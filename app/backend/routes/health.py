from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from core.db import get_db
from core.auth import require_admin
from core.response import APIResponse

from services.users.admin_staff import AdminStaffService
from models.users.user import User

router = APIRouter(prefix="/health", tags=["health"])

@router.get("/")
async def health_check():
    return APIResponse.success(data={"status": "healthy"})
