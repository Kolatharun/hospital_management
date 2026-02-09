"""
Queue Schemas - Lab and Pharmacy queue schemas

Derived from frontend AppointmentQueue.tsx Lab Queue and Pharmacy Queue tabs.
"""

from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field


class LabQueueItemBase(BaseModel):
    """Base lab queue item fields."""

    lab_tests: List[str] = Field(..., min_length=1)
    notes: Optional[str] = None


class LabQueueItemCreate(LabQueueItemBase):
    """Schema for creating a lab queue item."""

    appointment_id: UUID


class LabQueueItemResponse(BaseModel):
    """Lab queue item response."""

    id: UUID
    appointment_id: UUID
    patient_id: UUID
    patient_name: str
    mr_number: str
    op_number: str
    token_number: int
    lab_tests: List[str]
    status: str
    collected_at: Optional[str] = None
    completed_at: Optional[str] = None
    notes: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class LabQueueListResponse(BaseModel):
    """Lab queue list response."""

    items: List[LabQueueItemResponse]
    total: int
    waiting: int
    in_progress: int
    completed: int


class PharmacyQueueItemBase(BaseModel):
    """Base pharmacy queue item fields."""

    medicines: List[str] = Field(..., min_length=1)
    notes: Optional[str] = None


class PharmacyQueueItemCreate(PharmacyQueueItemBase):
    """Schema for creating a pharmacy queue item."""

    appointment_id: UUID


class PharmacyQueueItemResponse(BaseModel):
    """Pharmacy queue item response."""

    id: UUID
    appointment_id: UUID
    patient_id: UUID
    patient_name: str
    mr_number: str
    op_number: str
    token_number: int
    medicines: List[str]
    status: str
    dispensed_at: Optional[str] = None
    completed_at: Optional[str] = None
    notes: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class PharmacyQueueListResponse(BaseModel):
    """Pharmacy queue list response."""

    items: List[PharmacyQueueItemResponse]
    total: int
    waiting: int
    in_progress: int
    completed: int


class QueueStatusUpdate(BaseModel):
    """Schema for updating queue item status."""

    status: str = Field(..., description="waiting, in-progress, completed")

    class Config:
        json_schema_extra = {
            "example": {"status": "in-progress"}
        }


# Aliases for backward compatibility
LabQueueCreate = LabQueueItemCreate
LabQueueResponse = LabQueueItemResponse
PharmacyQueueCreate = PharmacyQueueItemCreate
PharmacyQueueResponse = PharmacyQueueItemResponse
