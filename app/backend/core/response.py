# API response models
from typing import Generic, Optional, TypeVar
from pydantic import BaseModel, Field


T = TypeVar("T")


class Pagination(BaseModel):
    # Pagination metadata for list responses
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    size: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total number of pages")


class APIResponse(BaseModel, Generic[T]):
    # Standard API response wrapper
    status: str = Field(..., description='"success" or "error"')
    message: str = Field("", description="User-friendly message")
    data: Optional[T] = Field(None, description="Payload data")
    pagination: Optional[Pagination] = Field(None, description="Pagination metadata")
    status_code: int = Field(200, description="HTTP status code")

    @classmethod
    def success(cls, data: T = None, message: str = "Success", status_code: int = 200) -> "APIResponse[T]":
        return cls(status="success", message=message, data=data, status_code=status_code)

    @classmethod
    def error(cls, message: str, status_code: int = 400) -> "APIResponse":
        return cls(status="error", message=message, data=None, status_code=status_code)
