"""
Common Schemas - Shared response structures

Used across all modules for consistent API responses.
"""

from typing import TypeVar, Generic, List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field

# Generic type for paginated responses
T = TypeVar("T")


class MessageResponse(BaseModel):
    """
    Simple message response.

    Used for operations that don't return data,
    like delete operations or status updates.
    """

    message: str = Field(..., description="Response message")
    success: bool = Field(default=True, description="Operation success status")

    class Config:
        json_schema_extra = {
            "example": {
                "message": "Operation completed successfully",
                "success": True,
            }
        }


class ErrorResponse(BaseModel):
    """
    Error response structure.

    Consistent error format for all API errors.
    """

    detail: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Application error code")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Error timestamp",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "detail": "Resource not found",
                "error_code": "NOT_FOUND",
                "timestamp": "2024-01-15T10:30:00Z",
            }
        }


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Generic paginated response wrapper.

    Used for list endpoints that support pagination.
    Derived from frontend table components that show paginated data.
    """

    items: List[T] = Field(..., description="List of items")
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number (1-indexed)")
    page_size: int = Field(..., description="Number of items per page")
    pages: int = Field(..., description="Total number of pages")
    has_next: bool = Field(..., description="Whether there is a next page")
    has_previous: bool = Field(..., description="Whether there is a previous page")

    class Config:
        json_schema_extra = {
            "example": {
                "items": [],
                "total": 100,
                "page": 1,
                "page_size": 20,
                "pages": 5,
                "has_next": True,
                "has_previous": False,
            }
        }


class HealthCheckResponse(BaseModel):
    """
    Health check response for monitoring.
    """

    status: str = Field(..., description="Service status")
    version: str = Field(..., description="Application version")
    database: str = Field(..., description="Database connection status")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Check timestamp",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "version": "1.0.0",
                "database": "connected",
                "timestamp": "2024-01-15T10:30:00Z",
            }
        }


class IDResponse(BaseModel):
    """
    Response containing just an ID.

    Used after create operations.
    """

    id: str = Field(..., description="Created resource ID")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
            }
        }
