"""
Document Schemas - Patient document upload schemas
"""

from typing import Optional, List
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field


class DocumentBase(BaseModel):
    """Base document fields."""

    document_type: str = Field(..., max_length=100, description="Document category")
    description: Optional[str] = Field(default=None, max_length=500)


class DocumentCreate(DocumentBase):
    """Schema for creating a document record."""

    patient_id: UUID
    appointment_id: Optional[UUID] = None
    file_name: str = Field(..., max_length=255)
    file_path: str = Field(..., max_length=500)
    file_type: str = Field(..., max_length=100, description="MIME type")
    file_size: int = Field(..., gt=0, description="File size in bytes")


class DocumentUpdate(BaseModel):
    """Schema for updating a document."""

    document_type: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)


class DocumentResponse(DocumentBase):
    """Document response schema."""

    id: UUID
    patient_id: UUID
    appointment_id: Optional[UUID] = None
    uploaded_by: Optional[UUID] = None
    file_name: str
    file_path: str
    file_type: str
    file_size: int
    file_size_formatted: Optional[str] = None
    patient_name: Optional[str] = None
    patient_mr_number: Optional[str] = None
    uploaded_by_name: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    """Paginated document list response."""

    items: List[DocumentResponse]
    total: int


class TodayDocumentsResponse(BaseModel):
    """Today's documents response."""

    items: List[DocumentResponse]
    total: int
