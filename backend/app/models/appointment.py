"""
Appointment Model - Patient Visits/Encounters

Derived from frontend analysis:
- PatientRegistration.tsx: Creates appointment on registration
- AppointmentQueue.tsx: Queue display and status management
- DoctorDashboard.tsx: Doctor's patient queue
- TVDisplayPage.tsx: Public display of current patient

State Machine (from frontend):
    waiting → in-progress → completed
       ↓
    cancelled

Database Fields:
- op_number: Outpatient Number (auto-generated OP-XXXXX)
- patient_id: Link to patient
- doctor_id: Assigned doctor
- appointment_date: Visit date
- appointment_time: Scheduled time
- status: Current status in workflow
- token_number: Queue position (daily sequence)
- room: Consultation room
- waiting_time_minutes: Calculated wait time
"""

import enum
from datetime import date, time, datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Column, String, Date, Time, Integer, Enum, ForeignKey, Index, event
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.patient import Patient
    from app.models.doctor import Doctor


class AppointmentStatus(str, enum.Enum):
    """
    Appointment status from frontend AppointmentQueue.tsx.

    State transitions:
    - waiting: Initial state when appointment is created
    - in-progress: Doctor has called the patient
    - completed: Consultation finished
    - cancelled: Appointment cancelled
    """
    WAITING = "waiting"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class QueueType(str, enum.Enum):
    """
    Queue type from frontend tabs.

    - main: Main doctor consultation queue
    - lab: Lab test queue
    - pharmacy: Pharmacy dispensing queue
    """
    MAIN = "main"
    LAB = "lab"
    PHARMACY = "pharmacy"


class Appointment(BaseModel):
    """
    Patient appointment/visit record.

    Represents a single patient visit. Links patient to doctor
    and tracks the consultation workflow.
    """

    __tablename__ = "appointments"

    # Unique identifier
    op_number = Column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
        comment="Outpatient Number (OP-YYYYMMDD-XXX format)",
    )

    # Patient link
    patient_id = Column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Link to patient",
    )

    # Doctor link
    doctor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("doctors.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Assigned doctor",
    )

    # Appointment details
    appointment_date = Column(
        Date,
        nullable=False,
        index=True,
        comment="Appointment date",
    )

    appointment_time = Column(
        Time,
        nullable=True,
        comment="Scheduled appointment time",
    )

    # Queue management
    token_number = Column(
        Integer,
        nullable=False,
        comment="Daily token/queue number",
    )

    status = Column(
        Enum(AppointmentStatus, name="appointment_status_enum", native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=AppointmentStatus.WAITING,
        index=True,
        comment="Current appointment status",
    )

    queue_type = Column(
        Enum(QueueType, name="queue_type_enum", native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=QueueType.MAIN,
        comment="Which queue this appointment is in",
    )

    # Consultation details
    room = Column(
        String(20),
        nullable=True,
        comment="Consultation room number",
    )

    waiting_time_minutes = Column(
        Integer,
        nullable=True,
        default=0,
        comment="Waiting time in minutes",
    )

    # Timestamps for status changes
    called_at = Column(
        String(50),  # Using string to store ISO timestamp
        nullable=True,
        comment="When patient was called (status → in-progress)",
    )

    completed_at = Column(
        String(50),
        nullable=True,
        comment="When consultation completed",
    )

    # Additional notes
    notes = Column(
        String(500),
        nullable=True,
        comment="Additional notes",
    )

    # Relationships
    patient = relationship(
        "Patient",
        backref="appointments",
        foreign_keys=[patient_id],
        lazy="joined",
    )

    doctor = relationship(
        "Doctor",
        backref="appointments",
        foreign_keys=[doctor_id],
        lazy="joined",
    )

    # Indexes for common queries
    __table_args__ = (
        Index("ix_appointments_date_status", "appointment_date", "status"),
        Index("ix_appointments_doctor_date", "doctor_id", "appointment_date"),
        Index("ix_appointments_patient_date", "patient_id", "appointment_date"),
    )

    @property
    def is_today(self) -> bool:
        """Check if appointment is for today."""
        return self.appointment_date == date.today()

    @property
    def can_call(self) -> bool:
        """Check if patient can be called (waiting status)."""
        return self.status == AppointmentStatus.WAITING

    @property
    def can_complete(self) -> bool:
        """Check if consultation can be completed (in-progress status)."""
        return self.status == AppointmentStatus.IN_PROGRESS

    def call_patient(self) -> None:
        """Mark patient as called (waiting → in-progress)."""
        if self.status == AppointmentStatus.WAITING:
            self.status = AppointmentStatus.IN_PROGRESS
            self.called_at = datetime.utcnow().isoformat()

    def complete_consultation(self) -> None:
        """Mark consultation as complete (in-progress → completed)."""
        if self.status == AppointmentStatus.IN_PROGRESS:
            self.status = AppointmentStatus.COMPLETED
            self.completed_at = datetime.utcnow().isoformat()

    def cancel(self) -> None:
        """Cancel the appointment."""
        if self.status in [AppointmentStatus.WAITING, AppointmentStatus.IN_PROGRESS]:
            self.status = AppointmentStatus.CANCELLED

    def __repr__(self) -> str:
        return f"<Appointment(id={self.id}, op_number={self.op_number}, status={self.status.value})>"
