"""
Department Model - Hospital Departments

Derived from frontend analysis:
- PatientRegistration.tsx: Department dropdown with 10 departments
- BillingSection.tsx: Department-based consultation fees

Database Fields:
- id: UUID primary key
- name: Department name (unique)
- code: Short code for references
- base_consultation_fee: Default consultation fee
- is_active: Whether department is active
"""

from decimal import Decimal
from sqlalchemy import Column, String, Numeric, Boolean

from app.models.base import BaseModel


class Department(BaseModel):
    """
    Hospital department/speciality.

    Each department has a base consultation fee used in billing.
    Doctors are assigned to departments.
    """

    __tablename__ = "departments"

    name = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
        comment="Department name (e.g., Cardiology)",
    )

    code = Column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
        comment="Short code (e.g., CARD)",
    )

    description = Column(
        String(500),
        nullable=True,
        comment="Department description",
    )

    base_consultation_fee = Column(
        Numeric(10, 2),
        nullable=False,
        default=Decimal("300.00"),
        comment="Default consultation fee for this department",
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
        comment="Whether department is active",
    )

    def __repr__(self) -> str:
        return f"<Department(id={self.id}, name={self.name}, fee={self.base_consultation_fee})>"


# Default departments from frontend PatientRegistration.tsx
DEFAULT_DEPARTMENTS = [
    {"name": "Cardiology", "code": "CARD", "base_consultation_fee": Decimal("500.00")},
    {"name": "General Medicine", "code": "GENM", "base_consultation_fee": Decimal("300.00")},
    {"name": "Orthopedics", "code": "ORTH", "base_consultation_fee": Decimal("400.00")},
    {"name": "Pediatrics", "code": "PEDI", "base_consultation_fee": Decimal("350.00")},
    {"name": "Dermatology", "code": "DERM", "base_consultation_fee": Decimal("400.00")},
    {"name": "ENT", "code": "ENT", "base_consultation_fee": Decimal("350.00")},
    {"name": "Ophthalmology", "code": "OPHT", "base_consultation_fee": Decimal("400.00")},
    {"name": "Gynecology", "code": "GYNE", "base_consultation_fee": Decimal("450.00")},
    {"name": "Neurology", "code": "NEUR", "base_consultation_fee": Decimal("600.00")},
    {"name": "Gastroenterology", "code": "GAST", "base_consultation_fee": Decimal("500.00")},
]
