"""
Patient Model - Patient Master Records

Derived from frontend analysis:
- PatientRegistration.tsx: All patient registration fields
- PatientSearch.tsx: Search by MR number, name, phone
- BillingSection.tsx: Patient details display

Database Fields mapped from frontend form:
- mr_number: Medical Record Number (auto-generated MR-XXXXX)
- first_name, last_name: Patient name
- date_of_birth: DOB for age calculation
- gender: Male/Female/Other
- marital_status: Single/Married/etc.
- patient_type: New/Review/etc.
- phone: Primary contact (Indian format)
- email: Optional email
- emergency_contact: Emergency phone
- address, city, state, pin_code: Address fields
"""

import enum
from datetime import date
from typing import Optional

from sqlalchemy import Column, String, Date, Enum, Text
from sqlalchemy.orm import validates

from app.models.base import BaseModel


class Gender(str, enum.Enum):
    """Gender options from frontend dropdown."""
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"


class MaritalStatus(str, enum.Enum):
    """Marital status options."""
    SINGLE = "Single"
    MARRIED = "Married"
    DIVORCED = "Divorced"
    WIDOWED = "Widowed"


class PatientType(str, enum.Enum):
    """Patient type options."""
    NEW = "New"
    REVIEW = "Review"
    EMERGENCY = "Emergency"
    REFERRAL = "Referral"


class Patient(BaseModel):
    """
    Patient master record.

    Contains all patient demographic and contact information.
    MR Number is auto-generated on creation.
    """

    __tablename__ = "patients"

    # Unique identifier
    mr_number = Column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
        comment="Medical Record Number (MR-XXXXX format)",
    )

    # Personal details
    first_name = Column(
        String(100),
        nullable=False,
        index=True,
        comment="Patient first name",
    )

    last_name = Column(
        String(100),
        nullable=False,
        index=True,
        comment="Patient last name",
    )

    date_of_birth = Column(
        Date,
        nullable=True,
        comment="Date of birth",
    )

    gender = Column(
        Enum(Gender, name="gender_enum", native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        comment="Patient gender",
    )

    marital_status = Column(
        Enum(MaritalStatus, name="marital_status_enum", native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=True,
        comment="Marital status",
    )

    patient_type = Column(
        Enum(PatientType, name="patient_type_enum", native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=True,
        default=PatientType.NEW,
        comment="Patient type",
    )

    # Contact details
    phone = Column(
        String(15),
        nullable=False,
        index=True,
        comment="Primary phone (Indian format)",
    )

    email = Column(
        String(255),
        nullable=True,
        index=True,
        comment="Email address",
    )

    emergency_contact = Column(
        String(15),
        nullable=True,
        comment="Emergency contact phone",
    )

    # Address
    address = Column(
        Text,
        nullable=True,
        comment="Street address",
    )

    city = Column(
        String(100),
        nullable=True,
        comment="City",
    )

    state = Column(
        String(100),
        nullable=True,
        comment="State",
    )

    pin_code = Column(
        String(10),
        nullable=True,
        comment="PIN code",
    )

    # Blood group (optional, useful for hospital)
    blood_group = Column(
        String(10),
        nullable=True,
        comment="Blood group",
    )

    @property
    def full_name(self) -> str:
        """Get patient's full name."""
        return f"{self.first_name} {self.last_name}"

    @property
    def age(self) -> Optional[int]:
        """Calculate age from date of birth."""
        if not self.date_of_birth:
            return None
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )

    @property
    def age_gender(self) -> str:
        """Format age and gender for display (e.g., '45/M')."""
        age_str = str(self.age) if self.age else "?"
        gender_str = self.gender.value[0] if self.gender else "?"
        return f"{age_str}/{gender_str}"

    @validates("phone")
    def validate_phone(self, key: str, phone: str) -> str:
        """Validate Indian phone number format."""
        if phone:
            # Remove any spaces or special characters
            cleaned = "".join(filter(str.isdigit, phone))
            # Remove country code if present
            if cleaned.startswith("91") and len(cleaned) == 12:
                cleaned = cleaned[2:]
            if len(cleaned) != 10:
                raise ValueError("Phone number must be 10 digits")
            if cleaned[0] not in "6789":
                raise ValueError("Phone number must start with 6, 7, 8, or 9")
        return phone

    def __repr__(self) -> str:
        return f"<Patient(id={self.id}, mr_number={self.mr_number}, name={self.full_name})>"
