"""Pydantic schemas for user-related models"""
from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional
from uuid import UUID


class UserRole(BaseModel):
    """User role schema"""
    role: str


class MemberBase(BaseModel):
    """Base Member schema with common attributes"""
    model_config = ConfigDict(from_attributes=True)
    
    full_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None


class MemberCreate(MemberBase):
    """Schema for creating a new member"""
    email: str
    password: str


class MemberResponse(MemberBase):
    """Schema for member API responses"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    email: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class MemberProfileUpdate(BaseModel):
    """Schema for updating member profile"""
    full_name: Optional[str] = None
    phone: Optional[str] = None


class MemberListResponse(BaseModel):
    """Schema for paginated member list"""
    model_config = ConfigDict(from_attributes=True)
    
    members: list[MemberResponse]
    total: int
    skip: int
    limit: int
