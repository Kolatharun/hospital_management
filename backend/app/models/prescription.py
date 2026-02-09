"""
Prescription Models - Medical Prescriptions

Derived from frontend analysis:
- PrescriptionForm.tsx: Prescription form with diagnosis, medicines, etc.
- PatientHistory.tsx: Prescription history display
"""

from typing import TYPE_CHECKING, List

from sqlalchemy import Column, String, Text, Boolean, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.patient import Patient
    from app.models.appointment import Appointment
    from app.models.doctor import Doctor


class Prescription(BaseModel):
    """
    Medical prescription record.

    Contains diagnosis, medicines, lab tests, and advice.
    """

    __tablename__ = "prescriptions"

    # Links
    patient_id = Column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Link to patient",
    )

    appointment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("appointments.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
        comment="Link to appointment",
    )

    doctor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("doctors.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Prescribing doctor",
    )

    # Clinical details
    diagnosis = Column(
        Text,
        nullable=False,
        comment="Primary diagnosis",
    )

    complaint = Column(
        Text,
        nullable=True,
        comment="Chief complaint",
    )

    history = Column(
        Text,
        nullable=True,
        comment="Relevant history",
    )

    # Lab tests (comma-separated or JSON)
    lab_tests = Column(
        Text,
        nullable=True,
        comment="Ordered lab tests",
    )

    # Advice
    advice = Column(
        Text,
        nullable=True,
        comment="Medical advice",
    )

    notes = Column(
        Text,
        nullable=True,
        comment="Additional notes",
    )

    # Follow-up
    follow_up_days = Column(
        Integer,
        nullable=True,
        comment="Follow-up after X days",
    )

    # Delivery status
    sent_to_patient = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="Whether sent to patient",
    )

    sent_via = Column(
        String(20),
        nullable=True,
        comment="Delivery method (whatsapp/email)",
    )

    # Relationships
    patient = relationship(
        "Patient",
        backref="prescriptions",
        foreign_keys=[patient_id],
    )

    appointment = relationship(
        "Appointment",
        backref="prescription",
        foreign_keys=[appointment_id],
        uselist=False,
    )

    doctor = relationship(
        "Doctor",
        backref="prescriptions",
        foreign_keys=[doctor_id],
    )

    medicines = relationship(
        "PrescriptionMedicine",
        back_populates="prescription",
        cascade="all, delete-orphan",
        order_by="PrescriptionMedicine.sequence_order",
    )

    def __repr__(self) -> str:
        return f"<Prescription(id={self.id}, diagnosis={self.diagnosis[:30] if self.diagnosis else ''})>"


class PrescriptionMedicine(BaseModel):
    """
    Individual medicine in a prescription.
    """

    __tablename__ = "prescription_medicines"

    # Link to prescription
    prescription_id = Column(
        UUID(as_uuid=True),
        ForeignKey("prescriptions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Link to prescription",
    )

    # Medicine details
    medicine_name = Column(
        String(200),
        nullable=False,
        comment="Medicine name",
    )

    dosage = Column(
        String(100),
        nullable=True,
        comment="Dosage (e.g., 10mg)",
    )

    frequency = Column(
        String(50),
        nullable=True,
        comment="Frequency (e.g., 1-0-1)",
    )

    duration = Column(
        String(50),
        nullable=True,
        comment="Duration (e.g., 30 days)",
    )

    instructions = Column(
        String(200),
        nullable=True,
        comment="Special instructions",
    )

    # Ordering
    sequence_order = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Order in prescription",
    )

    # Relationship
    prescription = relationship(
        "Prescription",
        back_populates="medicines",
    )

    def __repr__(self) -> str:
        return f"<PrescriptionMedicine(id={self.id}, name={self.medicine_name})>"
