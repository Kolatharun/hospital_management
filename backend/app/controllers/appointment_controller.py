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
from app.core.socket_manager import socket_manager
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
async def create_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Create a new appointment with token number."""
    service = AppointmentService(db)
    appointment = service.create_appointment(data)
    response = service.build_response(appointment)

    # Emit Socket.IO event for real-time updates
    doctor_id = str(appointment.doctor_id) if appointment.doctor_id else None
    await socket_manager.emit_queue_updated(
        doctor_id=doctor_id,
        data={"action": "appointment_created", "appointment_id": str(appointment.id)}
    )

    return response


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
async def call_patient(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.DOCTOR, UserRole.FRONT_OFFICE])),
):
    """Call next patient (mark as in_progress). Allowed for both doctor and front office."""
    service = AppointmentService(db)
    appointment = service.call_patient(appointment_id)
    response = service.build_response(appointment)

    # Emit Socket.IO event for real-time updates
    doctor_id = str(appointment.doctor_id) if appointment.doctor_id else None
    await socket_manager.emit_queue_updated(
        doctor_id=doctor_id,
        data={"action": "patient_called", "appointment_id": str(appointment.id)}
    )

    return response


@router.post("/call-next/{doctor_id}", response_model=AppointmentResponse)
async def call_next_patient(
    doctor_id: UUID,
    reduce_minutes: Optional[int] = Query(
        None,
        ge=1,
        le=60,
        description="Minutes to reduce from waiting patients (default: 15)"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.DOCTOR, UserRole.FRONT_OFFICE])),
):
    """
    Call the next waiting patient for a doctor.

    This endpoint efficiently:
    1. Gets the first waiting patient (ordered by check-in time)
    2. Changes their status to 'in-progress'
    3. Saves consultation_started_at timestamp
    4. Reduces waiting_time_minutes for ALL remaining waiting patients by reduce_minutes
    5. Emits 'queue_updated' Socket.IO event for real-time TV display updates

    The waiting_time reduction uses GREATEST(0, waiting_time - reduce_minutes) to ensure
    waiting times never go below zero.

    **Example:**
    Before: Patient A=0, B=15, C=30, D=45
    After call (reduce_minutes=15): A=in-progress, B=0, C=15, D=30

    Args:
        doctor_id: UUID of the doctor
        reduce_minutes: Minutes to subtract from waiting times (default: 15, configurable)

    Returns:
        The called appointment details

    Raises:
        400: Doctor already has a patient in-progress
        404: No patients waiting in queue
    """
    service = AppointmentService(db)
    appointment = service.call_next_patient(doctor_id, reduce_minutes)
    response = service.build_response(appointment)

    # Emit Socket.IO event for real-time updates (TV display, dashboards)
    await socket_manager.emit_queue_updated(
        doctor_id=str(doctor_id),
        data={
            "action": "patient_called",
            "appointment_id": str(appointment.id),
            "op_number": appointment.op_number,
            "patient_name": response.patient_name,
        }
    )

    # Also emit patient_called event for voice announcement trigger
    await socket_manager.emit_patient_called(
        appointment_id=str(appointment.id),
        patient_name=response.patient_name or "",
        op_number=appointment.op_number,
        room_number=appointment.room,
        doctor_id=str(doctor_id),
    )

    return response


@router.post("/{appointment_id}/complete", response_model=AppointmentResponse)
async def complete_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.DOCTOR])),
):
    """Complete an appointment."""
    service = AppointmentService(db)
    appointment = service.complete_appointment(appointment_id)
    response = service.build_response(appointment)

    # Emit Socket.IO event for real-time updates
    doctor_id = str(appointment.doctor_id) if appointment.doctor_id else None
    await socket_manager.emit_queue_updated(
        doctor_id=doctor_id,
        data={"action": "appointment_completed", "appointment_id": str(appointment.id)}
    )

    return response


@router.post("/{appointment_id}/cancel", response_model=AppointmentResponse)
async def cancel_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel an appointment."""
    service = AppointmentService(db)
    appointment = service.cancel_appointment(appointment_id)
    response = service.build_response(appointment)

    # Emit Socket.IO event for real-time updates
    doctor_id = str(appointment.doctor_id) if appointment.doctor_id else None
    await socket_manager.emit_queue_updated(
        doctor_id=doctor_id,
        data={"action": "appointment_cancelled", "appointment_id": str(appointment.id)}
    )

    return response


@router.post("/{appointment_id}/buffer", response_model=AppointmentResponse)
async def add_buffer_time(
    appointment_id: UUID,
    minutes: int = Query(..., ge=1, le=60),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.DOCTOR, UserRole.FRONT_OFFICE])),
):
    """Add buffer/waiting time to an appointment. Allowed for both doctor and front office."""
    service = AppointmentService(db)
    appointment = service.add_buffer_time(appointment_id, minutes)
    response = service.build_response(appointment)

    # Emit Socket.IO event for real-time updates
    doctor_id = str(appointment.doctor_id) if appointment.doctor_id else None
    await socket_manager.emit_queue_updated(
        doctor_id=doctor_id,
        data={"action": "buffer_time_added", "appointment_id": str(appointment.id)}
    )

    return response


@router.post("/{appointment_id}/mark-announced", response_model=AppointmentResponse)
def mark_announcement_played(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark announcement as played for TV display. Prevents duplicate announcements across screens."""
    service = AppointmentService(db)
    appointment = service.mark_announcement_played(appointment_id)
    return service.build_response(appointment)


@router.post("/{appointment_id}/complete-announcement", response_model=AppointmentResponse)
async def complete_announcement(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Complete announcement and transition to in-progress (calling → in-progress).

    Called by TV display after voice announcement finishes successfully.
    Atomically sets announcement_played=True and status=IN_PROGRESS.
    Multi-TV safe: only first caller succeeds, subsequent calls return current state.
    """
    service = AppointmentService(db)
    appointment = service.complete_announcement(appointment_id)
    response = service.build_response(appointment)

    # Emit Socket.IO event for real-time updates
    doctor_id = str(appointment.doctor_id) if appointment.doctor_id else None
    await socket_manager.emit_queue_updated(
        doctor_id=doctor_id,
        data={"action": "announcement_completed", "appointment_id": str(appointment.id)}
    )

    return response
