"""
Appointment Controller - Appointment and queue management endpoints
"""

from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.appointment import AppointmentStatus
from app.services.appointment_service import AppointmentService
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    QueueStatsResponse,
    QueueDisplayResponse,
)

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.post("", response_model=AppointmentResponse)
def create_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Create a new appointment with token number."""
    service = AppointmentService(db)
    appointment = service.create_appointment(data)
    return service.build_response(appointment)


@router.get("/today", response_model=list[AppointmentResponse])
def get_today_appointments(
    doctor_id: Optional[UUID] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get today's appointments with optional filters."""
    service = AppointmentService(db)
    status_enum = AppointmentStatus(status) if status else None
    appointments = service.get_today_appointments(doctor_id, status_enum)
    return [service.build_response(a) for a in appointments]


@router.get("/queue/stats", response_model=QueueStatsResponse)
def get_queue_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get queue statistics for today."""
    service = AppointmentService(db)
    return service.get_queue_stats()


@router.get("/queue/display", response_model=QueueDisplayResponse)
def get_queue_display(
    doctor_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get queue display data for TV/monitor."""
    service = AppointmentService(db)
    return service.get_queue_display(doctor_id)


@router.get("/queue/waiting", response_model=list[AppointmentResponse])
def get_waiting_queue(
    doctor_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get waiting patients in queue."""
    service = AppointmentService(db)
    appointments = service.get_waiting_queue(doctor_id)
    return [service.build_response(a) for a in appointments]


@router.get("/patient/{patient_id}", response_model=list[AppointmentResponse])
def get_patient_appointments(
    patient_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get appointments for a patient."""
    service = AppointmentService(db)
    appointments = service.get_patient_appointments(patient_id, skip, limit)
    return [service.build_response(a) for a in appointments]


@router.get("/op/{op_number}", response_model=AppointmentResponse)
def get_by_op_number(
    op_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get appointment by OP number."""
    service = AppointmentService(db)
    appointment = service.get_by_op_number(op_number)
    return service.build_response(appointment)


@router.get("/by-date", response_model=list[AppointmentResponse])
def get_appointments_by_date(
    date: date = Query(..., description="Date in YYYY-MM-DD format"),
    doctor_id: Optional[UUID] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get appointments for a specific date with optional filters."""
    service = AppointmentService(db)
    status_enum = AppointmentStatus(status) if status else None
    appointments = service.get_appointments_by_date(date, doctor_id, status_enum)
    return [service.build_response(a) for a in appointments]


@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get appointment by ID."""
    service = AppointmentService(db)
    appointment = service.get_appointment(appointment_id)
    return service.build_response(appointment)


@router.post("/{appointment_id}/call", response_model=AppointmentResponse)
def call_patient(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.DOCTOR, UserRole.FRONT_OFFICE])),
):
    """Call next patient (mark as in_progress). Allowed for both doctor and front office."""
    service = AppointmentService(db)
    appointment = service.call_patient(appointment_id)
    return service.build_response(appointment)


@router.post("/{appointment_id}/complete", response_model=AppointmentResponse)
def complete_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.DOCTOR])),
):
    """Complete an appointment."""
    service = AppointmentService(db)
    appointment = service.complete_appointment(appointment_id)
    return service.build_response(appointment)


@router.post("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel an appointment."""
    service = AppointmentService(db)
    appointment = service.cancel_appointment(appointment_id)
    return service.build_response(appointment)


@router.post("/{appointment_id}/buffer")
def add_buffer_time(
    appointment_id: UUID,
    minutes: int = Query(..., ge=1, le=60),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.DOCTOR, UserRole.FRONT_OFFICE])),
):
    """Add buffer/waiting time to an appointment. Allowed for both doctor and front office."""
    service = AppointmentService(db)
    appointment = service.add_buffer_time(appointment_id, minutes)
    return service.build_response(appointment)
