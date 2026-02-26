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
