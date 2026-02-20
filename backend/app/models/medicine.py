"""
Medicine Master Model - Medicine Inventory Management

Stores master data for medicines used in prescriptions.
"""

from sqlalchemy import Column, String, Boolean, Index, UniqueConstraint

from app.models.base import BaseModel


class MedicineMaster(BaseModel):
    """
    Master data for medicines.
    Used by admin module for medicine management.

    Unique constraint: (code, specialization) - same code can exist
    in different specializations but not within the same one.
    """

    __tablename__ = "medicine_master"

    code = Column(
        String(50),
        nullable=False,
        index=True,
        comment="Medicine code (unique per specialization)",
    )

    name = Column(
        String(255),
        nullable=False,
        index=True,
        comment="Medicine brand name",
    )

    generic_name = Column(
        String(255),
        nullable=True,
        comment="Generic/chemical name",
    )

    category = Column(
        String(100),
        nullable=True,
        index=True,
        comment="Medicine category (e.g., Blood Pressure, CAD)",
    )

    specialization = Column(
        String(100),
        nullable=False,
        index=True,
        comment="Medical specialization (e.g., Cardiology)",
    )

    dosage_form = Column(
        String(50),
        nullable=True,
        comment="Form of medicine (Tablet, Capsule, etc.)",
    )

    strength = Column(
        String(50),
        nullable=True,
        comment="Strength/dosage (e.g., 5mg, 10ml)",
    )

    manufacturer = Column(
        String(200),
        nullable=True,
        comment="Manufacturer name",
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
        comment="Whether medicine is currently available",
    )

    # Composite indexes and constraints
    __table_args__ = (
        # Unique constraint: code + specialization must be unique
        UniqueConstraint("code", "specialization", name="uq_medicine_code_specialization"),
        Index("ix_medicine_master_name_active", "name", "is_active"),
        Index("ix_medicine_master_category_spec", "category", "specialization"),
        Index("ix_medicine_master_code_spec", "code", "specialization"),
    )

    def __repr__(self) -> str:
        return f"<MedicineMaster(code={self.code}, name={self.name}, spec={self.specialization})>"
