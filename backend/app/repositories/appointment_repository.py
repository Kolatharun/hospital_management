"""
Appointment Repository - Appointment database operations
"""

from datetime import date, datetime
from typing import Optional, List, Dict
from uuid import UUID

from sqlalchemy import func, text, and_
from sqlalchemy.orm import Session, joinedload

from app.repositories.base import BaseRepository
from app.models.appointment import Appointment, AppointmentStatus, QueueType


# Configurable consultation slot settings for queue waiting time calculation
CONSULTATION_TIME_MINUTES = 15
BUFFER_TIME_MINUTES = 0


class AppointmentRepository(BaseRepository[Appointment]):
    """Repository for Appointment model operations."""

    def __init__(self, db: Session):
        super().__init__(Appointment, db)

    def get_by_op_number(self, op_number: str) -> Optional[Appointment]:
        """Get appointment by OP number."""
        return self.db.query(Appointment).options(
            joinedload(Appointment.patient),
            joinedload(Appointment.doctor),
        ).filter(
            Appointment.op_number == op_number,
            Appointment.is_deleted == False,
        ).first()

    def get_with_details(self, appointment_id: UUID) -> Optional[Appointment]:
        """Get appointment with patient and doctor details."""
        return self.db.query(Appointment).options(
            joinedload(Appointment.patient),
            joinedload(Appointment.doctor),
        ).filter(
            Appointment.id == appointment_id,
            Appointment.is_deleted == False,
        ).first()

    def get_today_appointments(
        self,
        doctor_id: Optional[UUID] = None,
        status: Optional[AppointmentStatus] = None,
    ) -> List[Appointment]:
        """Get today's appointments with optional filters."""
        today = date.today()
        query = self.db.query(Appointment).options(
            joinedload(Appointment.patient),
            joinedload(Appointment.doctor),
        ).filter(
            Appointment.appointment_date == today,
            Appointment.is_deleted == False,
        )

        if doctor_id:
            query = query.filter(Appointment.doctor_id == doctor_id)
        if status:
            query = query.filter(Appointment.status == status)

        return query.order_by(Appointment.token_number).all()

    def get_appointments_by_date(
        self,
        appointment_date: date,
        doctor_id: Optional[UUID] = None,
        status: Optional[AppointmentStatus] = None,
    ) -> List[Appointment]:
        """Get appointments for a specific date with optional filters."""
        query = self.db.query(Appointment).options(
            joinedload(Appointment.patient),
            joinedload(Appointment.doctor),
        ).filter(
            Appointment.appointment_date == appointment_date,
            Appointment.is_deleted == False,
        )

        if doctor_id:
            query = query.filter(Appointment.doctor_id == doctor_id)
        if status:
            query = query.filter(Appointment.status == status)

        return query.order_by(Appointment.token_number).all()

    def get_queue_stats(self, appointment_date: Optional[date] = None) -> Dict[str, int]:
        """Get queue statistics for a date."""
        target_date = appointment_date or date.today()

        stats = self.db.query(
            Appointment.status,
            func.count(Appointment.id),
        ).filter(
            Appointment.appointment_date == target_date,
            Appointment.is_deleted == False,
        ).group_by(Appointment.status).all()

        result = {
            "waiting": 0,
            "in_progress": 0,
            "completed": 0,
            "cancelled": 0,
            "total": 0,
        }

        for status, count in stats:
            if status == AppointmentStatus.WAITING:
                result["waiting"] = count
            elif status == AppointmentStatus.IN_PROGRESS:
                result["in_progress"] = count
            elif status == AppointmentStatus.COMPLETED:
                result["completed"] = count
            elif status == AppointmentStatus.CANCELLED:
                result["cancelled"] = count
            result["total"] += count

        return result

    def get_current_patient(self, doctor_id: Optional[UUID] = None) -> Optional[Appointment]:
        """Get the current in-progress patient."""
        today = date.today()
        query = self.db.query(Appointment).options(
            joinedload(Appointment.patient),
            joinedload(Appointment.doctor),
        ).filter(
            Appointment.appointment_date == today,
            Appointment.status == AppointmentStatus.IN_PROGRESS,
            Appointment.is_deleted == False,
        )

        if doctor_id:
            query = query.filter(Appointment.doctor_id == doctor_id)

        return query.first()

    def get_waiting_queue(self, doctor_id: Optional[UUID] = None) -> List[Appointment]:
        """Get waiting patients for today."""
        today = date.today()
        query = self.db.query(Appointment).options(
            joinedload(Appointment.patient),
            joinedload(Appointment.doctor),
        ).filter(
            Appointment.appointment_date == today,
            Appointment.status == AppointmentStatus.WAITING,
            Appointment.is_deleted == False,
        )

        if doctor_id:
            query = query.filter(Appointment.doctor_id == doctor_id)

        return query.order_by(Appointment.token_number).all()

    def get_patient_appointments(
        self,
        patient_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Appointment]:
        """Get appointments for a patient."""
        return self.db.query(Appointment).options(
            joinedload(Appointment.doctor),
        ).filter(
            Appointment.patient_id == patient_id,
            Appointment.is_deleted == False,
        ).order_by(Appointment.appointment_date.desc()).offset(skip).limit(limit).all()

    def get_next_token_number(self, appointment_date: date) -> int:
        """Get next token number for a date."""
        result = self.db.query(func.max(Appointment.token_number)).filter(
            Appointment.appointment_date == appointment_date,
        ).scalar()
        return (result or 0) + 1

    def generate_op_number(self, appointment_date: date) -> str:
        """Generate OP number for an appointment."""
        date_str = appointment_date.strftime("%Y%m%d")
        result = self.db.execute(text("SELECT nextval('op_number_seq')"))
        seq_val = result.scalar()
        return f"OP-{date_str}-{seq_val:03d}"

    def update_status(
        self,
        appointment_id: UUID,
        status: AppointmentStatus,
    ) -> Optional[Appointment]:
        """Update appointment status."""
        appointment = self.get_by_id(appointment_id)
        if not appointment:
            return None

        appointment.status = status

        if status == AppointmentStatus.IN_PROGRESS:
            appointment.called_at = datetime.utcnow().isoformat()
        elif status == AppointmentStatus.COMPLETED:
            appointment.completed_at = datetime.utcnow().isoformat()

        self.db.commit()
        self.db.refresh(appointment)
        return appointment

    def add_buffer_time(self, appointment_id: UUID, minutes: int) -> Optional[Appointment]:
        """Add buffer time to a patient's consultation slot."""
        appointment = self.get_by_id(appointment_id)
        if not appointment:
            return None

        current = appointment.buffer_time_minutes or 0
        appointment.buffer_time_minutes = current + minutes

        self.db.commit()
        self.db.refresh(appointment)
        return appointment

    def recalculate_waiting_times(self) -> None:
        """Recalculate waiting_time_minutes for all today's appointments based on queue position.

        Waiting times are calculated PER DOCTOR - each doctor has their own queue.
        Each patient's effective slot = CONSULTATION_TIME_MINUTES + BUFFER_TIME_MINUTES + their buffer_time_minutes.
        A patient's waiting time = sum of effective slots of all patients ahead of them in their doctor's queue.

        - In-progress patient: 0 min (already with doctor)
        - Waiting patients: cumulative sum of preceding slots for same doctor
        - Completed/cancelled: 0 min
        """
        today = date.today()
        base_slot = CONSULTATION_TIME_MINUTES + BUFFER_TIME_MINUTES

        appointments = self.db.query(Appointment).filter(
            Appointment.appointment_date == today,
            Appointment.is_deleted == False,
        ).order_by(Appointment.token_number).all()

        # Group appointments by doctor_id
        doctor_queues: Dict[UUID, list] = {}
        for apt in appointments:
            doctor_id = apt.doctor_id
            if doctor_id not in doctor_queues:
                doctor_queues[doctor_id] = []
            doctor_queues[doctor_id].append(apt)

        # Calculate waiting times per doctor
        for doctor_id, doctor_appointments in doctor_queues.items():
            # Build ordered list of active patients (in-progress first, then waiting)
            active_queue = [a for a in doctor_appointments if a.status == AppointmentStatus.IN_PROGRESS]
            active_queue += [a for a in doctor_appointments if a.status == AppointmentStatus.WAITING]

            # Calculate cumulative waiting time for this doctor's queue
            cumulative = 0
            for apt in active_queue:
                effective_slot = base_slot + (apt.buffer_time_minutes or 0)
                if apt.status == AppointmentStatus.IN_PROGRESS:
                    apt.waiting_time_minutes = 0
                    cumulative += effective_slot
                elif apt.status == AppointmentStatus.WAITING:
                    apt.waiting_time_minutes = cumulative
                    cumulative += effective_slot

            # Zero out completed/cancelled for this doctor
            for apt in doctor_appointments:
                if apt.status in (AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED):
                    apt.waiting_time_minutes = 0

        self.db.commit()

    def get_billable_appointments(self, appointment_date: Optional[date] = None) -> List[Appointment]:
        """Get appointments that can be billed (completed, not yet billed)."""
        target_date = appointment_date or date.today()
        return self.db.query(Appointment).options(
            joinedload(Appointment.patient),
            joinedload(Appointment.doctor),
        ).filter(
            Appointment.appointment_date == target_date,
            Appointment.status.in_([AppointmentStatus.IN_PROGRESS, AppointmentStatus.COMPLETED]),
            Appointment.is_deleted == False,
        ).order_by(Appointment.token_number).all()
