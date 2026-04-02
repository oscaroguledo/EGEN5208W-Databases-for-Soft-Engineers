from typing import Optional
from uuid import UUID
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext

from core.db import get_db
from models.users.user import User, UserRole
from services.users.user import UserService

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBasic(auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


class RoleChecker:
    """
    Role-based access control dependency for FastAPI
    Uses email/password authentication (no JWT tokens)
    """
    
    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles
    
    async def __call__(
        self,
        credentials: Optional[HTTPBasicCredentials] = Depends(security),
        db: AsyncSession = Depends(get_db)
    ) -> User:
        """
        Authenticate user with email/password and check role
        """
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
                headers={"WWW-Authenticate": "Basic"},
            )
        
        # Authenticate with email and password
        user = await UserService.get_user_by_email(db, credentials.username)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Basic"},
            )
        
        if not verify_password(credentials.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Basic"},
            )
        
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[role.value for role in self.allowed_roles]}"
            )
        
        return user

# Predefined role checkers for common use cases
require_member = RoleChecker([UserRole.member])
require_trainer = RoleChecker([UserRole.trainer])
require_admin = RoleChecker([UserRole.admin])
require_trainer_or_admin = RoleChecker([UserRole.trainer, UserRole.admin])
require_member_or_trainer = RoleChecker([UserRole.member, UserRole.trainer])
require_any_role = RoleChecker([UserRole.member, UserRole.trainer, UserRole.admin])

class PermissionChecker:
    """
    Permission-based access control for more granular access.
    Uses database queries to verify trainer-member assignments.
    """
    
    @staticmethod
    async def can_access_member_data(
        current_user: User, 
        target_member_id: UUID,
        db: AsyncSession
    ) -> bool:
        """
        Check if current user can access member data.
        Members can only access their own data.
        Trainers can access data of members assigned to them (via training sessions).
        Admins can access all member data.
        """
        # Members can only access their own data
        if current_user.role == UserRole.member:
            return current_user.id == target_member_id
        
        # Admins can access all member data
        if current_user.role == UserRole.admin:
            return True
        
        # Trainers can access data of members assigned to them
        if current_user.role == UserRole.trainer:
            from sqlalchemy import select, exists
            from models.trainings import TrainingSession
            
            # Check if trainer has any training sessions with this member
            query = select(
                exists().where(
                    (TrainingSession.trainer_id == current_user.id) &
                    (TrainingSession.member_id == target_member_id)
                )
            )
            result = await db.execute(query)
            has_training_session = result.scalar()
            
            if has_training_session:
                return True
            
            # Also check if member is enrolled in trainer's classes
            from models.trainings import Class, Enrollment
            query = select(
                exists().where(
                    (Class.trainer_id == current_user.id) &
                    (Enrollment.class_id == Class.id) &
                    (Enrollment.member_id == target_member_id)
                )
            )
            result = await db.execute(query)
            has_class_enrollment = result.scalar()
            
            return has_class_enrollment
        
        return False
    
    @staticmethod
    async def can_access_trainer_data(
        current_user: User, 
        target_trainer_id: UUID,
        db: AsyncSession
    ) -> bool:
        """
        Check if current user can access trainer data.
        Trainers can access their own data.
        Members can access data of trainers assigned to them.
        Admins can access all trainer data.
        """
        # Trainers can access their own data
        if current_user.role == UserRole.trainer:
            return current_user.id == target_trainer_id
        
        # Admins can access all trainer data
        if current_user.role == UserRole.admin:
            return True
        
        # Members can access data of their assigned trainers
        if current_user.role == UserRole.member:
            from sqlalchemy import select, exists
            from models.trainings import TrainingSession
            
            # Check if member has any training sessions with this trainer
            query = select(
                exists().where(
                    (TrainingSession.member_id == current_user.id) &
                    (TrainingSession.trainer_id == target_trainer_id)
                )
            )
            result = await db.execute(query)
            return result.scalar()
        
        return False
    
    @staticmethod
    def can_manage_schedules(current_user: User) -> bool:
        """
        Check if current user can manage schedules.
        Only trainers and admins can manage schedules.
        """
        return current_user.role in [UserRole.trainer, UserRole.admin]
    
    @staticmethod
    def can_manage_billing(current_user: User) -> bool:
        """
        Check if current user can access billing information.
        Only admins can manage billing.
        """
        return current_user.role == UserRole.admin
    
    @staticmethod
    async def can_view_health_metrics(
        current_user: User, 
        member_id: Optional[UUID] = None,
        db: AsyncSession = None
    ) -> bool:
        """
        Check if current user can view health metrics.
        Members can view their own health metrics.
        Trainers can view health metrics of assigned members.
        Admins can view all health metrics.
        """
        # Members can view their own health metrics
        if current_user.role == UserRole.member:
            return member_id is None or current_user.id == member_id
        
        # Admins can view all health metrics
        if current_user.role == UserRole.admin:
            return True
        
        # Trainers can view health metrics of assigned members
        if current_user.role == UserRole.trainer and db is not None and member_id is not None:
            from sqlalchemy import select, exists
            from models.trainings import TrainingSession
            
            # Check if trainer has any training sessions with this member
            query = select(
                exists().where(
                    (TrainingSession.trainer_id == current_user.id) &
                    (TrainingSession.member_id == member_id)
                )
            )
            result = await db.execute(query)
            return result.scalar()
        
        # If no member_id specified, trainers can view (filtered list will be applied)
        if current_user.role == UserRole.trainer and member_id is None:
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
