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

# Configurable: Minutes to reduce from waiting patients when a patient is called
# This accounts for average consultation progress, keeping next patient ETA > 0
REDUCE_MINUTES_ON_CALL = 10


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

    def calculate_initial_waiting_time(self, doctor_id: UUID, appointment_date: date) -> int:
        """
        Calculate initial waiting_time for a new patient being added to queue.

        Logic:
        - Find the last patient in queue for the same doctor with status='waiting'
        - Order by created_at descending to get the most recently added waiting patient
        - new_waiting_time = last_patient's waiting_time + 15
        - If no waiting patients exist, return 0

        Args:
            doctor_id: The doctor's UUID
            appointment_date: The appointment date

        Returns:
            Initial waiting_time_minutes for the new patient
        """
        # Find the last waiting patient for this doctor, ordered by created_at descending
        last_waiting = self.db.query(Appointment).filter(
            Appointment.appointment_date == appointment_date,
            Appointment.doctor_id == doctor_id,
            Appointment.status == AppointmentStatus.WAITING,
            Appointment.is_deleted == False,
        ).order_by(Appointment.created_at.desc()).first()

        if last_waiting:
            # Add 15 minutes to the last waiting patient's waiting_time
            last_waiting_time = last_waiting.waiting_time_minutes or 0
            return last_waiting_time + CONSULTATION_TIME_MINUTES
        else:
            # No waiting patients, new patient starts with 0 waiting time
            return 0

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
            appointment.waiting_time_minutes = 0
            # Reset announcement flags so TV display will announce this patient
            appointment.announcement_played = False
            appointment.announcement_played_at = None
        elif status == AppointmentStatus.COMPLETED:
            appointment.completed_at = datetime.utcnow().isoformat()

        self.db.commit()
        self.db.refresh(appointment)
        return appointment

    def reduce_waiting_times_for_doctor(
        self,
        doctor_id: UUID,
        exclude_appointment_id: UUID,
        reduce_minutes: int = REDUCE_MINUTES_ON_CALL,
    ) -> int:
        """
        Reduce waiting_time_minutes for all waiting patients of a doctor.

        Args:
            doctor_id: The doctor's UUID
            exclude_appointment_id: Appointment to exclude (the one being called)
            reduce_minutes: Minutes to reduce (default: REDUCE_MINUTES_ON_CALL)

        Returns:
            Number of rows updated
        """
        today = date.today()

        result = self.db.query(Appointment).filter(
            Appointment.appointment_date == today,
            Appointment.doctor_id == doctor_id,
            Appointment.status == AppointmentStatus.WAITING,
            Appointment.is_deleted == False,
            Appointment.id != exclude_appointment_id,
        ).update(
            {
                Appointment.waiting_time_minutes: func.greatest(
                    0,
                    Appointment.waiting_time_minutes - reduce_minutes
                )
            },
            synchronize_session='fetch'
        )

        return result

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

    def increase_waiting_times_behind(
        self,
        doctor_id: UUID,
        after_token_number: int,
        increase_minutes: int,
    ) -> int:
        """
        Increase waiting_time_minutes for patients behind in queue.

        Called when buffer time is added to a patient - patients behind
        need their waiting times increased.

        Args:
            doctor_id: The doctor's UUID
            after_token_number: Only update patients with token > this number
            increase_minutes: Minutes to add to waiting time

        Returns:
            Number of rows updated
        """
        today = date.today()

        result = self.db.query(Appointment).filter(
            Appointment.appointment_date == today,
            Appointment.doctor_id == doctor_id,
            Appointment.status == AppointmentStatus.WAITING,
            Appointment.is_deleted == False,
            Appointment.token_number > after_token_number,
        ).update(
            {
                Appointment.waiting_time_minutes: Appointment.waiting_time_minutes + increase_minutes
            },
            synchronize_session='fetch'
        )

        return result

    def recalculate_waiting_times(self) -> None:
        """Recalculate waiting_time_minutes for today's appointments.

        IMPORTANT: Does NOT modify WAITING patients unless they are new (no eta_started_at).
        This prevents ETA resets when a patient status changes to in-progress.

        Waiting times are calculated PER DOCTOR - each doctor has their own queue.
        Frontend handles elapsed time calculation based on eta_started_at.

        Updates:
        - IN_PROGRESS: waiting_time = 0 (preserve eta_started_at if set)
        - WAITING (new only): calculate initial waiting_time based on queue position
        - COMPLETED/CANCELLED: clear values
        """
        today = date.today()
        base_slot = CONSULTATION_TIME_MINUTES + BUFFER_TIME_MINUTES
        now_iso = datetime.utcnow().isoformat()

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
            # Build ordered list: in-progress first (for cumulative), then waiting
            in_progress = [a for a in doctor_appointments if a.status == AppointmentStatus.IN_PROGRESS]
            waiting = [a for a in doctor_appointments if a.status == AppointmentStatus.WAITING]

            # Calculate cumulative time for queue position
            cumulative = 0

            # In-progress patients: set waiting_time = 0, add their slot to cumulative
            for apt in in_progress:
                apt.waiting_time_minutes = 0
                # Only set eta_started_at if not already set
                if not apt.eta_started_at:
                    apt.eta_started_at = now_iso
                effective_slot = base_slot + (apt.buffer_time_minutes or 0)
                cumulative += effective_slot

            # Waiting patients: only update if NEW (no eta_started_at)
            for apt in waiting:
                effective_slot = base_slot + (apt.buffer_time_minutes or 0)
                if not apt.eta_started_at:
                    # New patient - set initial waiting time
                    apt.waiting_time_minutes = cumulative
                    apt.eta_started_at = now_iso
                # Always add to cumulative for patients behind in queue
                cumulative += effective_slot

            # Zero out completed/cancelled
            for apt in doctor_appointments:
                if apt.status in (AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED):
                    apt.waiting_time_minutes = 0
                    apt.eta_started_at = None

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

    def call_next_patient_efficient(
        self,
        doctor_id: UUID,
        reduce_minutes: Optional[int] = None,
    ) -> Optional[Appointment]:
        """
        Efficiently call the next waiting patient for a doctor.

        This method performs the following in a single transaction:
        1. Gets the first waiting patient (ordered by created_at/check-in time)
        2. Updates status to IN_PROGRESS with called_at timestamp
        3. Reduces waiting_time_minutes for all remaining waiting patients
           using a single bulk UPDATE with GREATEST(0, waiting_time - reduce_minutes)

        Args:
            doctor_id: The doctor's UUID
            reduce_minutes: Minutes to reduce from waiting patients (default: REDUCE_MINUTES_ON_CALL)

        Returns:
            The called appointment or None if no waiting patients

        Raises:
            Exception: If transaction fails (automatically rolled back)
        """
        today = date.today()
        minutes_to_reduce = reduce_minutes if reduce_minutes is not None else REDUCE_MINUTES_ON_CALL

        try:
            # Get the first waiting patient for this doctor, ordered by created_at (check-in time)
            first_waiting = self.db.query(Appointment).filter(
                Appointment.appointment_date == today,
                Appointment.doctor_id == doctor_id,
                Appointment.status == AppointmentStatus.WAITING,
                Appointment.is_deleted == False,
            ).order_by(Appointment.created_at).first()

            if not first_waiting:
                return None

            # Store the appointment ID to exclude from bulk update
            called_appointment_id = first_waiting.id
            now_iso = datetime.utcnow().isoformat()

            # Update the called patient's status to IN_PROGRESS
            first_waiting.status = AppointmentStatus.IN_PROGRESS
            first_waiting.called_at = now_iso
            first_waiting.waiting_time_minutes = 0
            # Reset announcement_played so TV display will announce this patient
            first_waiting.announcement_played = False
            first_waiting.announcement_played_at = None

            # Bulk update: Reduce waiting_time_minutes for remaining waiting patients
            # Using func.greatest to ensure waiting_time never goes below 0
            self.db.query(Appointment).filter(
                Appointment.appointment_date == today,
                Appointment.doctor_id == doctor_id,
                Appointment.status == AppointmentStatus.WAITING,
                Appointment.is_deleted == False,
                Appointment.id != called_appointment_id,
            ).update(
                {
                    Appointment.waiting_time_minutes: func.greatest(
                        0,
                        Appointment.waiting_time_minutes - minutes_to_reduce
                    )
                },
                synchronize_session='fetch'
            )

            # Commit the transaction
            self.db.commit()

            # Refresh and return the called appointment with details
            self.db.refresh(first_waiting)

            # Re-query with joins to get patient and doctor details
            return self.db.query(Appointment).options(
                joinedload(Appointment.patient),
                joinedload(Appointment.doctor),
            ).filter(
                Appointment.id == called_appointment_id
            ).first()

        except Exception as e:
            # Rollback on any error
            self.db.rollback()
            raise e
