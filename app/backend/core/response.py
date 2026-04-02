# API response models
from typing import Generic, Optional, TypeVar, List
from pydantic import BaseModel, Field
from pydantic.generics import GenericModel


T = TypeVar("T")


class Pagination(BaseModel):
    # Pagination metadata for list responses
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    size: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total number of pages")


class APIResponse(GenericModel, Generic[T]):
    # Standard API response wrapper
    status: str = Field(..., description='"success" or "error"')
    message: str = Field(..., description="User-friendly message")
    data: Optional[T] = Field(None, description="Payload data")
    pagination: Optional[Pagination] = Field(None, description="Pagination metadata")
    status_code: int = Field(..., description="HTTP status code")