"""
Appointment Service - Appointment and queue business logic
"""

from datetime import date, datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.repositories.appointment_repository import AppointmentRepository
from app.repositories.patient_repository import PatientRepository
from app.repositories.department_repository import DoctorRepository
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    QueueStats,
    TodayQueueResponse,
    TVDisplayResponse,
    CurrentPatientResponse,
    WaitingQueueItem,
)


class AppointmentService:
    """Service for appointment operations."""

    def __init__(self, db: Session):
        self.db = db
        self.appointment_repo = AppointmentRepository(db)
        self.patient_repo = PatientRepository(db)
        self.doctor_repo = DoctorRepository(db)

    def create_appointment(self, data: AppointmentCreate) -> Appointment:
        """Create a new appointment."""
        # Verify patient exists
        patient = self.patient_repo.get_by_id(data.patient_id)
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found",
            )

        # Verify doctor exists if provided and get doctor's room
        doctor = None
        if data.doctor_id:
            doctor = self.doctor_repo.get_by_id(data.doctor_id)
            if not doctor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Doctor not found",
                )

        # Generate OP number and token
        op_number = self.appointment_repo.generate_op_number(data.appointment_date)
        token_number = self.appointment_repo.get_next_token_number(data.appointment_date)

        # Use doctor's room if no room explicitly provided
        room = data.room if data.room else (doctor.room if doctor else None)

        appointment_data = {
            "op_number": op_number,
            "patient_id": data.patient_id,
            "doctor_id": data.doctor_id,
            "appointment_date": data.appointment_date,
            "appointment_time": data.appointment_time,
            "token_number": token_number,
            "room": room,
            "notes": data.notes,
        }

        appointment = self.appointment_repo.create(appointment_data)
        self.appointment_repo.recalculate_waiting_times()
        return appointment

    def get_appointment(self, appointment_id: UUID) -> Appointment:
        """Get appointment by ID."""
        appointment = self.appointment_repo.get_with_details(appointment_id)
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found",
            )
        return appointment

    def get_by_op_number(self, op_number: str) -> Appointment:
        """Get appointment by OP number."""
        appointment = self.appointment_repo.get_by_op_number(op_number)
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found",
            )
        return appointment

    def get_today_queue(self, doctor_id: Optional[UUID] = None) -> TodayQueueResponse:
        """Get today's appointment queue."""
        appointments = self.appointment_repo.get_today_appointments(doctor_id=doctor_id)
        stats_dict = self.appointment_repo.get_queue_stats()

        stats = QueueStats(
            waiting=stats_dict["waiting"],
            in_progress=stats_dict["in_progress"],
            completed=stats_dict["completed"],
            cancelled=stats_dict["cancelled"],
            total_today=stats_dict["total"],
        )

        return TodayQueueResponse(
            appointments=[self.build_response(a) for a in appointments],
            stats=stats,
        )

    def get_queue_stats(self, doctor_id: Optional[UUID] = None) -> QueueStats:
        """Get queue statistics, optionally filtered by doctor."""
        # TODO: Add doctor-specific stats filtering in repository if needed
        stats_dict = self.appointment_repo.get_queue_stats()
        return QueueStats(
            waiting=stats_dict["waiting"],
            in_progress=stats_dict["in_progress"],
            completed=stats_dict["completed"],
            cancelled=stats_dict["cancelled"],
            total_today=stats_dict["total"],
        )

    def get_today_appointments(
        self,
        doctor_id: Optional[UUID] = None,
        status: Optional[AppointmentStatus] = None,
    ) -> List[Appointment]:
        """Get today's appointments with optional filters."""
        return self.appointment_repo.get_today_appointments(doctor_id, status)

    def get_appointments_by_date(
        self,
        appointment_date: date,
        doctor_id: Optional[UUID] = None,
        status: Optional[AppointmentStatus] = None,
    ) -> List[Appointment]:
        """Get appointments for a specific date with optional filters."""
        return self.appointment_repo.get_appointments_by_date(appointment_date, doctor_id, status)

    def get_waiting_queue(self, doctor_id: Optional[UUID] = None) -> List[Appointment]:
        """Get waiting patients in queue."""
        return self.appointment_repo.get_waiting_queue(doctor_id)

    def get_current_patient(self, doctor_id: Optional[UUID] = None) -> Optional[Appointment]:
        """Get the current patient being seen."""
        return self.appointment_repo.get_current_patient(doctor_id)

    def get_patient_appointments(
        self,
        patient_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Appointment]:
        """Get appointments for a patient."""
        return self.appointment_repo.get_patient_appointments(patient_id, skip, limit)

    def call_next_patient(self, doctor_id: UUID) -> Appointment:
        """Call the next patient in queue for a doctor."""
        # Check if doctor already has a patient in progress
        current = self.appointment_repo.get_current_patient(doctor_id)
        if current:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Complete the current consultation before calling next patient",
            )

        # Get the next waiting patient
        waiting = self.appointment_repo.get_waiting_queue(doctor_id)
        if not waiting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No patients waiting in queue",
            )

        next_patient = waiting[0]
        result = self.appointment_repo.update_status(next_patient.id, AppointmentStatus.IN_PROGRESS)
        self.appointment_repo.recalculate_waiting_times()
        return result

    def complete_appointment(self, appointment_id: UUID) -> Appointment:
        """Complete an appointment (alias for complete_consultation)."""
        return self.complete_consultation(appointment_id)

    def call_patient(self, appointment_id: UUID, room: Optional[str] = None) -> Appointment:
        """Call patient (waiting → in-progress)."""
        appointment = self.get_appointment(appointment_id)

        if appointment.status != AppointmentStatus.WAITING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only call patients with 'waiting' status",
            )

        # Update room if provided
        if room:
            self.appointment_repo.update(appointment_id, {"room": room})

        result = self.appointment_repo.update_status(appointment_id, AppointmentStatus.IN_PROGRESS)
        self.appointment_repo.recalculate_waiting_times()
        return result

    def complete_consultation(self, appointment_id: UUID) -> Appointment:
        """Complete consultation (in-progress → completed)."""
        appointment = self.get_appointment(appointment_id)

        if appointment.status != AppointmentStatus.IN_PROGRESS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only complete appointments with 'in-progress' status",
            )

        result = self.appointment_repo.update_status(appointment_id, AppointmentStatus.COMPLETED)
        self.appointment_repo.recalculate_waiting_times()
        return result

    def cancel_appointment(self, appointment_id: UUID) -> Appointment:
        """Cancel appointment."""
        appointment = self.get_appointment(appointment_id)

        if appointment.status in [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot cancel completed or already cancelled appointments",
            )

        result = self.appointment_repo.update_status(appointment_id, AppointmentStatus.CANCELLED)
        self.appointment_repo.recalculate_waiting_times()
        return result

    def add_buffer_time(self, appointment_id: UUID, minutes: int) -> Appointment:
        """Add buffer time to a patient's consultation slot and recalculate queue."""
        appointment = self.get_appointment(appointment_id)
        result = self.appointment_repo.add_buffer_time(appointment_id, minutes)
        self.appointment_repo.recalculate_waiting_times()
        return result

    def get_queue_display(self, doctor_id: Optional[UUID] = None) -> TVDisplayResponse:
        """Get data for TV display page."""
        current = self.appointment_repo.get_current_patient(doctor_id)
        waiting = self.appointment_repo.get_waiting_queue(doctor_id)
        stats_dict = self.appointment_repo.get_queue_stats()

        current_patient = None
        if current and current.patient:
            current_patient = CurrentPatientResponse(
                op_number=current.op_number,
                patient_name=current.patient.full_name,
                mr_number=current.patient.mr_number,
                room=current.room,
                doctor_name=current.doctor.name if current.doctor else None,
            )

        waiting_queue = []
        for apt in waiting:
            if apt.patient:
                waiting_queue.append(WaitingQueueItem(
                    op_number=apt.op_number,
                    patient_name=apt.patient.full_name,
                    mr_number=apt.patient.mr_number,
                    waiting_time_minutes=apt.waiting_time_minutes or 0,
                    token_number=apt.token_number,
                ))

        stats = QueueStats(
            waiting=stats_dict["waiting"],
            in_progress=stats_dict["in_progress"],
            completed=stats_dict["completed"],
            cancelled=stats_dict["cancelled"],
            total_today=stats_dict["total"],
        )

        return TVDisplayResponse(
            current_patient=current_patient,
            waiting_queue=waiting_queue,
            stats=stats,
        )

    def build_response(self, appointment: Appointment) -> AppointmentResponse:
        """Build appointment response with joined data."""
        patient = appointment.patient
        doctor = appointment.doctor

        return AppointmentResponse(
            id=appointment.id,
            op_number=appointment.op_number,
            patient_id=appointment.patient_id,
            doctor_id=appointment.doctor_id,
            appointment_date=appointment.appointment_date,
            appointment_time=appointment.appointment_time,
            token_number=appointment.token_number,
            status=appointment.status.value,
            queue_type=appointment.queue_type.value,
            room=appointment.room,
            waiting_time_minutes=appointment.waiting_time_minutes,
            called_at=appointment.called_at,
            completed_at=appointment.completed_at,
            notes=appointment.notes,
            created_at=appointment.created_at.isoformat() if appointment.created_at else None,
            patient_name=patient.full_name if patient else None,
            patient_mr_number=patient.mr_number if patient else None,
            patient_phone=patient.phone if patient else None,
            patient_email=patient.email if patient else None,
            patient_age_gender=patient.age_gender if patient else None,
            doctor_name=doctor.name if doctor else None,
        )
