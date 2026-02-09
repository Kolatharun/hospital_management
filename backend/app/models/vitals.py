"""
PatientVitals Model - Vital Signs Records

Derived from frontend analysis:
- VitalsCollection.tsx: All vitals input fields
- DoctorDashboard.tsx: Vitals display in prescription

Database Fields mapped from frontend form:
- spo2: Oxygen saturation (%)
- pulse: Heart rate (BPM)
- blood_pressure: BP reading (format: "130/85")
- cvs: Cardiovascular system findings
- rs: Respiratory system findings
- jvp: Jugular venous pressure
- weight: Patient weight (kg)
- Medical history flags: htn, dm, smoking, family_ho_cad, etc.
- current_drugs: Current medications
"""

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Column, String, Integer, Numeric, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.patient import Patient
    from app.models.appointment import Appointment
    from app.models.user import User


class PatientVitals(BaseModel):
    """
    Patient vital signs recorded during visit.

    One vitals record per appointment.
    """

    __tablename__ = "patient_vitals"

    # Links
    appointment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("appointments.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
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

    recorded_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="Staff who recorded vitals",
    )

    # Primary vitals
    spo2 = Column(
        Integer,
        nullable=True,
        comment="Oxygen saturation percentage",
    )

    pulse = Column(
        Integer,
        nullable=False,
        comment="Pulse rate (beats per minute)",
    )

    blood_pressure = Column(
        String(20),
        nullable=False,
        comment="Blood pressure (format: systolic/diastolic)",
    )

    # Secondary vitals
    cvs = Column(
        String(100),
        nullable=True,
        comment="Cardiovascular system findings",
    )

    rs = Column(
        String(100),
        nullable=True,
        comment="Respiratory system findings",
    )

    jvp = Column(
        String(50),
        nullable=True,
        comment="Jugular venous pressure",
    )

    weight = Column(
        Numeric(5, 2),
        nullable=True,
        comment="Weight in kg",
    )

    # Medical history flags (cardiology specific)
    hlp = Column(
        String(50),
        nullable=True,
        comment="Hyperlipidemia status",
    )

    htn = Column(
        String(50),
        nullable=True,
        comment="Hypertension status",
    )

    dm = Column(
        String(50),
        nullable=True,
        comment="Diabetes mellitus status",
    )

    smoking = Column(
        String(50),
        nullable=True,
        comment="Smoking status",
    )

    family_ho_cad = Column(
        String(100),
        nullable=True,
        comment="Family history of coronary artery disease",
    )

    heart_disease = Column(
        String(100),
        nullable=True,
        comment="Known heart disease",
    )

    ptca_cabg = Column(
        String(100),
        nullable=True,
        comment="Previous PTCA/CABG procedures",
    )

    current_drugs = Column(
        Text,
        nullable=True,
        comment="Current medications",
    )

    # Relationships
    appointment = relationship(
        "Appointment",
        backref="vitals",
        foreign_keys=[appointment_id],
        uselist=False,
    )

    patient = relationship(
        "Patient",
        backref="vitals_records",
        foreign_keys=[patient_id],
    )

    recorder = relationship(
        "User",
        backref="recorded_vitals",
        foreign_keys=[recorded_by],
    )

    @property
    def spo2_status(self) -> str:
        """Get SPO2 status category."""
        if self.spo2 is None:
            return "unknown"
        if self.spo2 >= 95:
            return "normal"
        if self.spo2 >= 90:
            return "low"
        return "critical"

    @property
    def systolic(self) -> int | None:
        """Extract systolic BP."""
        if self.blood_pressure and "/" in self.blood_pressure:
            try:
                return int(self.blood_pressure.split("/")[0])
            except ValueError:
                return None
        return None

    @property
    def diastolic(self) -> int | None:
        """Extract diastolic BP."""
        if self.blood_pressure and "/" in self.blood_pressure:
            try:
                return int(self.blood_pressure.split("/")[1])
            except ValueError:
                return None
        return None

    def __repr__(self) -> str:
        return f"<PatientVitals(id={self.id}, bp={self.blood_pressure}, pulse={self.pulse})>"
