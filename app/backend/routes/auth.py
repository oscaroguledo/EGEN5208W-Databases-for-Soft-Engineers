from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from core.db import get_db
from core.response import APIResponse
from services.users.user import UserService
from models.users.user import User, UserRole

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/login", response_model=APIResponse[dict])
async def login(
    email: str,
    password: str,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate user and return access token"""
    try:
        # Authenticate user
        user = await UserService.authenticate_user(db, email, password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Generate access token (simplified for demo)
        # In production, use proper JWT generation
        access_token = str(user.id)  # Simplified - use JWT in production
        token_type = "bearer"
        expires_in = 1800  # 30 minutes
        
        return APIResponse.success({
            "access_token": access_token,
            "token_type": token_type,
            "expires_in": expires_in,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "role": user.role.value,
                "full_name": getattr(user, 'full_name', email)
            }
        })
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/logout", response_model=APIResponse[dict])
async def logout():
    """Logout user (client-side token removal)"""
    # In a stateless JWT system, logout is handled client-side
    # In production, you might implement token blacklisting
    return APIResponse.success({
        "message": "Successfully logged out",
        "instruction": "Please remove the token from your client storage"
    })

@router.post("/refresh", response_model=APIResponse[dict])
async def refresh_token(
    current_user: User = Depends(lambda: None)  # This would validate existing token
):
    """Refresh access token"""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    # Generate new token (simplified)
    new_token = str(current_user.id)
    
    return APIResponse.success({
        "access_token": new_token,
        "token_type": "bearer",
        "expires_in": 1800
    })

@router.get("/me", response_model=APIResponse[dict])
async def get_current_user_info(
    current_user: User = Depends(lambda: None)  # This would validate existing token
):
    """Get current user information"""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    return APIResponse.success({
        "id": str(current_user.id),
        "email": current_user.email,
        "role": current_user.role.value,
        "full_name": getattr(current_user, 'full_name', current_user.email)
    })

@router.post("/verify", response_model=APIResponse[dict])
async def verify_token(
    current_user: User = Depends(lambda: None)  # This would validate existing token
):
    """Verify if token is valid"""
    if not current_user:
        return APIResponse.success({
            "valid": False,
            "message": "Token is invalid or expired"
        })
    
    return APIResponse.success({
        "valid": True,
        "user_id": str(current_user.id),
        "role": current_user.role.value
    })
