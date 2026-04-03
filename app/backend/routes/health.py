from fastapi import APIRouter
from core.response import APIResponse

router = APIRouter(prefix="/health", tags=["health"])

@router.get("/")
async def health_check():
    return APIResponse.success(data={"status": "healthy"})
