"""
Doctor Model - Physician Records

Derived from frontend analysis:
- PatientRegistration.tsx: Doctor dropdown filtered by department
- DoctorDashboard.tsx: Doctor's consultation view
- BillingSection.tsx: Doctor name and speciality display
- PrescriptionForm.tsx: Doctor name on prescriptions

Database Fields:
- id: UUID primary key
- user_id: Link to User for authentication
- department_id: Doctor's department
- name: Full name (Dr. prefix)
- speciality: Medical speciality
- qualification: Medical qualifications
- registration_number: Medical council registration
- room: Default consultation room
- consultation_fee: Override fee (or use department default)
- is_available: Current availability status
"""

from decimal import Decimal
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Column, String, Numeric, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.department import Department


class Doctor(BaseModel):
    """
    Doctor/Physician record.

    Links to User for authentication and Department for categorization.
    """

    __tablename__ = "doctors"

    # Link to User account
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
        index=True,
        comment="Link to user account for authentication",
    )

    # Link to Department
    department_id = Column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Doctor's primary department",
    )

    # Doctor details
    name = Column(
        String(200),
        nullable=False,
        index=True,
        comment="Full name with title (e.g., Dr. R. Balaji)",
    )

    speciality = Column(
        String(100),
        nullable=True,
        comment="Medical speciality",
    )

    qualification = Column(
        String(200),
        nullable=True,
        comment="Medical qualifications (e.g., MBBS, MD)",
    )

    registration_number = Column(
        String(50),
        nullable=True,
        unique=True,
        comment="Medical council registration number",
    )

    phone = Column(
        String(15),
        nullable=True,
        comment="Contact phone number",
    )

    email = Column(
        String(255),
        nullable=True,
        comment="Professional email",
    )

    # Consultation settings
    room = Column(
        String(20),
        nullable=True,
        comment="Default consultation room",
    )

    consultation_fee = Column(
        Numeric(10, 2),
        nullable=True,
        comment="Override consultation fee (null = use department fee)",
    )

    # Availability
    is_available = Column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
        comment="Whether doctor is currently available for consultations",
    )

    # Relationships
    user = relationship(
        "User",
        backref="doctor",
        foreign_keys=[user_id],
        lazy="joined",
    )

    department = relationship(
        "Department",
        backref="doctors",
        foreign_keys=[department_id],
        lazy="joined",
    )

    def get_consultation_fee(self) -> Decimal:
        """
        Get effective consultation fee.

        Returns doctor's custom fee if set, otherwise department's base fee.
        """
        if self.consultation_fee is not None:
            return self.consultation_fee
        if self.department:
            return self.department.base_consultation_fee
        return Decimal("300.00")  # Default fallback

    def __repr__(self) -> str:
        return f"<Doctor(id={self.id}, name={self.name}, department={self.department_id})>"


# Default doctors from frontend (for seeding)
DEFAULT_DOCTORS = [
    {
        "name": "Dr. R. Balaji",
        "speciality": "Cardiology",
        "qualification": "MBBS, MD, DM (Cardiology)",
        "room": "101",
    },
    {
        "name": "Dr. Priya Sharma",
        "speciality": "Cardiology",
        "qualification": "MBBS, MD, DM (Cardiology)",
        "room": "102",
    },
    {
        "name": "Dr. Rajesh Kumar",
        "speciality": "General Medicine",
        "qualification": "MBBS, MD (Medicine)",
        "room": "201",
    },
    {
        "name": "Dr. Lakshmi Devi",
        "speciality": "Pediatrics",
        "qualification": "MBBS, MD (Pediatrics)",
        "room": "301",
    },
    {
        "name": "Dr. Suresh Reddy",
        "speciality": "Dermatology",
        "qualification": "MBBS, MD (Dermatology)",
        "room": "401",
    },
]
