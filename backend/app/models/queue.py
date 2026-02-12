"""
Queue Models - Lab and Pharmacy Queues

Derived from frontend analysis:
- AppointmentQueue.tsx: Lab Queue and Pharmacy Queue tabs
- PrescriptionForm.tsx: "Send to Lab" and "Send to Pharmacy" buttons

State Machine:
    waiting → in-progress → completed
"""

import enum
from typing import TYPE_CHECKING, List

from sqlalchemy import Column, String, Integer, Enum, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.patient import Patient
    from app.models.appointment import Appointment


class QueueStatus(str, enum.Enum):
    """Queue item status."""
    PENDING = "pending"
    WAITING = "waiting"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class LabQueueItem(BaseModel):
    """
    Lab test queue item.

    Created when doctor sends patient to lab from prescription.
    """

    __tablename__ = "lab_queue_items"

    # Links
    appointment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("appointments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Link to appointment",
    )

    patient_id = Column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Link to patient",
    )

    # Display fields (denormalized)
    patient_name = Column(
        String(200),
        nullable=False,
        comment="Patient name for display",
    )

    mr_number = Column(
        String(20),
        nullable=False,
        comment="MR number for display",
    )

    op_number = Column(
        String(20),
        nullable=False,
        comment="OP number for display",
    )

    # Queue management
    token_number = Column(
        Integer,
        nullable=False,
        comment="Lab queue token number",
    )

    # Lab tests (stored as JSON array)
    lab_tests = Column(
        JSONB,
        nullable=False,
        default=list,
        comment="List of lab tests to perform",
    )

    # Status
    status = Column(
        Enum(QueueStatus, name="queue_status_enum", native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=QueueStatus.WAITING,
        index=True,
        comment="Queue item status",
    )

    # Timestamps
    collected_at = Column(
        String(50),
        nullable=True,
        comment="When sample was collected",
    )

    completed_at = Column(
        String(50),
        nullable=True,
        comment="When results were ready",
    )

    # Notes
    notes = Column(
        Text,
        nullable=True,
        comment="Additional notes",
    )

    # Relationships
    appointment = relationship(
        "Appointment",
        backref="lab_queue_item",
        foreign_keys=[appointment_id],
        uselist=False,
    )

    patient = relationship(
        "Patient",
        backref="lab_queue_items",
        foreign_keys=[patient_id],
    )

    # Indexes
    __table_args__ = (
        Index("ix_lab_queue_created_status", "created_at", "status"),
    )

    def mark_collected(self) -> None:
        """Mark sample as collected."""
        if self.status == QueueStatus.WAITING:
            self.status = QueueStatus.IN_PROGRESS
            from datetime import datetime
            self.collected_at = datetime.utcnow().isoformat()

    def mark_completed(self) -> None:
        """Mark as completed."""
        if self.status == QueueStatus.IN_PROGRESS:
            self.status = QueueStatus.COMPLETED
            from datetime import datetime
            self.completed_at = datetime.utcnow().isoformat()

    def __repr__(self) -> str:
        return f"<LabQueueItem(id={self.id}, token={self.token_number}, status={self.status.value})>"


class PharmacyQueueItem(BaseModel):
    """
    Pharmacy dispensing queue item.

    Created when doctor sends prescription to pharmacy.
    """

    __tablename__ = "pharmacy_queue_items"

    # Links
    appointment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("appointments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Link to appointment",
    )

    patient_id = Column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Link to patient",
    )

    # Display fields (denormalized)
    patient_name = Column(
        String(200),
        nullable=False,
        comment="Patient name for display",
    )

    mr_number = Column(
        String(20),
        nullable=False,
        comment="MR number for display",
    )

    op_number = Column(
        String(20),
        nullable=False,
        comment="OP number for display",
    )

    # Queue management
    token_number = Column(
        Integer,
        nullable=False,
        comment="Pharmacy queue token number",
    )

    # Medicines (stored as JSON array)
    medicines = Column(
        JSONB,
        nullable=False,
        default=list,
        comment="List of medicines to dispense",
    )

    # Status
    status = Column(
        Enum(QueueStatus, name="queue_status_enum", native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=QueueStatus.WAITING,
        index=True,
        comment="Queue item status",
    )

    # Timestamps
    dispensed_at = Column(
        String(50),
        nullable=True,
        comment="When medicines were dispensed",
    )

    completed_at = Column(
        String(50),
        nullable=True,
        comment="When patient collected medicines",
    )

    # Notes
    notes = Column(
        Text,
        nullable=True,
        comment="Additional notes",
    )

    # Relationships
    appointment = relationship(
        "Appointment",
        backref="pharmacy_queue_item",
        foreign_keys=[appointment_id],
        uselist=False,
    )

    patient = relationship(
        "Patient",
        backref="pharmacy_queue_items",
        foreign_keys=[patient_id],
    )

    # Indexes
    __table_args__ = (
        Index("ix_pharmacy_queue_created_status", "created_at", "status"),
    )

    def mark_dispensed(self) -> None:
        """Mark as being dispensed."""
        if self.status == QueueStatus.WAITING:
            self.status = QueueStatus.IN_PROGRESS
            from datetime import datetime
            self.dispensed_at = datetime.utcnow().isoformat()

    def mark_completed(self) -> None:
        """Mark as completed."""
        if self.status == QueueStatus.IN_PROGRESS:
            self.status = QueueStatus.COMPLETED
            from datetime import datetime
            self.completed_at = datetime.utcnow().isoformat()

    def __repr__(self) -> str:
        return f"<PharmacyQueueItem(id={self.id}, token={self.token_number}, status={self.status.value})>"
