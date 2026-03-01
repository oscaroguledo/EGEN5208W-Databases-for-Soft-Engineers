from typing import Optional
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from core.db import get_db
from models.users.user import User, UserRole
from services.users.user import UserService

security = HTTPBearer()

class RoleChecker:
    """
    Role-based access control dependency for FastAPI
    """
    
    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles
    
    async def __call__(
        self,
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: AsyncSession = Depends(get_db)
    ) -> User:
        """
        Check if the current user has the required role
        """
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated"
            )
        
        # For demo purposes, we'll use a simple token-based auth
        # In production, you'd decode JWT tokens here
        try:
            user_id = UUID(credentials.credentials)
            user = await UserService.get_user(db, user_id)
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found"
                )
            
            if user.role not in self.allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Required roles: {[role.value for role in self.allowed_roles]}"
                )
            
            return user
            
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )

# Predefined role checkers for common use cases
require_member = RoleChecker([UserRole.member])
require_trainer = RoleChecker([UserRole.trainer])
require_admin = RoleChecker([UserRole.admin])
require_trainer_or_admin = RoleChecker([UserRole.trainer, UserRole.admin])
require_member_or_trainer = RoleChecker([UserRole.member, UserRole.trainer])
require_any_role = RoleChecker([UserRole.member, UserRole.trainer, UserRole.admin])

class PermissionChecker:
    """
    Permission-based access control for more granular access
    """
    
    @staticmethod
    def can_access_member_data(current_user: User, target_member_id: UUID) -> bool:
        """
        Check if current user can access member data
        """
        # Members can only access their own data
        if current_user.role == UserRole.member:
            return current_user.id == target_member_id
        
        # Trainers can access data of members assigned to them
        if current_user.role == UserRole.trainer:
            # In a real implementation, you'd check if member is assigned to trainer
            return True  # Simplified for demo
        
        # Admins can access all member data
        if current_user.role == UserRole.admin:
            return True
        
        return False
    
    @staticmethod
    def can_access_trainer_data(current_user: User, target_trainer_id: UUID) -> bool:
        """
        Check if current user can access trainer data
        """
        # Trainers can access their own data
        if current_user.role == UserRole.trainer:
            return current_user.id == target_trainer_id
        
        # Admins can access all trainer data
        if current_user.role == UserRole.admin:
            return True
        
        return False
    
    @staticmethod
    def can_manage_schedules(current_user: User) -> bool:
        """
        Check if current user can manage schedules
        """
        return current_user.role in [UserRole.trainer, UserRole.admin]
    
    @staticmethod
    def can_manage_billing(current_user: User) -> bool:
        """
        Check if current user can access billing information
        """
        return current_user.role == UserRole.admin
    
    @staticmethod
    def can_view_health_metrics(
        current_user: User, 
        member_id: Optional[UUID] = None
    ) -> bool:
        """
        Check if current user can view health metrics
        """
        # Members can view their own health metrics
        if current_user.role == UserRole.member:
            return member_id is None or current_user.id == member_id
        
        # Trainers can view health metrics of assigned members
        if current_user.role == UserRole.trainer:
            return True  # Simplified - in real implementation, check assignment
        
        # Admins can view all health metrics
        if current_user.role == UserRole.admin:
            return True
        
        return False

def get_current_user_role(current_user: User) -> UserRole:
    """Helper function to get current user's role"""
    return current_user.role

def is_admin(current_user: User) -> bool:
    """Check if current user is admin"""
    return current_user.role == UserRole.admin

def is_trainer(current_user: User) -> bool:
    """Check if current user is trainer"""
    return current_user.role == UserRole.trainer

def is_member(current_user: User) -> bool:
    """Check if current user is member"""
    return current_user.role == UserRole.member
