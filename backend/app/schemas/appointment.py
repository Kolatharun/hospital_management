"""
Appointment Schemas - Appointment and Queue related schemas

Derived from frontend:
- AppointmentQueue.tsx
- DoctorDashboard.tsx
- TVDisplayPage.tsx
"""

from datetime import date, time
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field


class AppointmentBase(BaseModel):
    """Base appointment fields."""

    patient_id: UUID
    doctor_id: Optional[UUID] = None
    appointment_date: date
    appointment_time: Optional[time] = None
    room: Optional[str] = Field(default=None, max_length=20)
    notes: Optional[str] = Field(default=None, max_length=500)


class AppointmentCreate(AppointmentBase):
    """Schema for creating an appointment."""
    pass


class AppointmentUpdate(BaseModel):
    """Schema for updating an appointment."""

    doctor_id: Optional[UUID] = None
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    room: Optional[str] = Field(default=None, max_length=20)
    notes: Optional[str] = Field(default=None, max_length=500)


class AppointmentStatusUpdate(BaseModel):
    """Schema for updating appointment status."""

    status: str = Field(..., description="waiting, in-progress, completed, cancelled")

    class Config:
        json_schema_extra = {
            "example": {"status": "in-progress"}
        }


class AppointmentResponse(BaseModel):
    """Appointment response schema."""

    id: UUID
    op_number: str
    patient_id: UUID
    doctor_id: Optional[UUID] = None
    appointment_date: date
    appointment_time: Optional[time] = None
    token_number: int
    status: str
    queue_type: str
    room: Optional[str] = None
    waiting_time_minutes: Optional[int] = None
    called_at: Optional[str] = None
    completed_at: Optional[str] = None
    notes: Optional[str] = None
    created_at: str

    # Joined data
    patient_name: Optional[str] = None
    patient_mr_number: Optional[str] = None
    patient_phone: Optional[str] = None
    patient_age_gender: Optional[str] = None
    doctor_name: Optional[str] = None

    class Config:
        from_attributes = True


class AppointmentListResponse(BaseModel):
    """Paginated appointment list response."""

    items: List[AppointmentResponse]
    total: int
    page: int
    page_size: int


class TodayQueueResponse(BaseModel):
    """Today's queue response for frontend."""

    appointments: List[AppointmentResponse]
    stats: "QueueStats"


class QueueStats(BaseModel):
    """Queue statistics for dashboard."""

    waiting: int = 0
    in_progress: int = 0
    completed: int = 0
    cancelled: int = 0
    lab_queue: int = 0
    pharmacy_queue: int = 0
    total_today: int = 0


class CurrentPatientResponse(BaseModel):
    """Current patient being served (for TV display)."""

    op_number: str
    patient_name: str
    mr_number: str
    room: Optional[str] = None
    doctor_name: Optional[str] = None


class WaitingQueueItem(BaseModel):
    """Item in waiting queue (for TV display)."""

    op_number: str
    patient_name: str
    mr_number: str
    waiting_time_minutes: int
    token_number: int


class TVDisplayResponse(BaseModel):
    """Response for TV display page."""

    current_patient: Optional[CurrentPatientResponse] = None
    waiting_queue: List[WaitingQueueItem]
    stats: QueueStats


class CallPatientRequest(BaseModel):
    """Request to call a patient."""

    room: Optional[str] = Field(default=None, description="Override room number")


class AddBufferTimeRequest(BaseModel):
    """Request to add buffer time."""

    minutes: int = Field(default=5, ge=1, le=60)


# Update forward reference
TodayQueueResponse.model_rebuild()

# Aliases for backward compatibility
QueueStatsResponse = QueueStats
QueueDisplayResponse = TVDisplayResponse
