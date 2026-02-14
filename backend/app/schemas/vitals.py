"""
Vitals Schemas - Patient vital signs schemas

Derived from frontend VitalsCollection.tsx form fields.
"""

from decimal import Decimal
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class VitalsBase(BaseModel):
    """Base vitals fields from frontend form."""

    # Primary vitals (required)
    pulse: int = Field(..., ge=30, le=250, description="Pulse rate BPM")
    blood_pressure: str = Field(..., description="Format: systolic/diastolic")

    # Secondary vitals (optional)
    spo2: Optional[int] = Field(default=None, ge=50, le=100, description="SpO2 percentage")
    cvs: Optional[str] = Field(default=None, max_length=100)
    rs: Optional[str] = Field(default=None, max_length=100)
    jvp: Optional[str] = Field(default=None, max_length=50)
    weight: Optional[Decimal] = Field(default=None, ge=0, le=500)

    # Medical history flags
    hlp: Optional[str] = Field(default=None, max_length=50)
    htn: Optional[str] = Field(default=None, max_length=50)
    dm: Optional[str] = Field(default=None, max_length=50)
    smoking: Optional[str] = Field(default=None, max_length=50)
    family_ho_cad: Optional[str] = Field(default=None, max_length=100)
    heart_disease: Optional[str] = Field(default=None, max_length=100)
    ptca_cabg: Optional[str] = Field(default=None, max_length=100)
    current_drugs: Optional[str] = None

    @field_validator("blood_pressure")
    @classmethod
    def validate_blood_pressure(cls, v: str) -> str:
        """Validate BP format (systolic/diastolic)."""
        if "/" not in v:
            raise ValueError("Blood pressure must be in format: systolic/diastolic")
        parts = v.split("/")
        if len(parts) != 2:
            raise ValueError("Blood pressure must have exactly two values")
        try:
            systolic = int(parts[0])
            diastolic = int(parts[1])
            if not (50 <= systolic <= 300):
                raise ValueError("Systolic must be between 50 and 300")
            if not (30 <= diastolic <= 200):
                raise ValueError("Diastolic must be between 30 and 200")
        except ValueError as e:
            if "invalid literal" in str(e):
                raise ValueError("Blood pressure values must be numbers")
            raise
        return v


class VitalsCreate(VitalsBase):
    """Schema for recording vitals."""

    appointment_id: UUID

    class Config:
        json_schema_extra = {
            "example": {
                "appointment_id": "550e8400-e29b-41d4-a716-446655440000",
                "pulse": 72,
                "blood_pressure": "120/80",
                "spo2": 98,
                "weight": 70.5,
            }
        }


class VitalsUpdate(BaseModel):
    """Schema for updating vitals."""

    pulse: Optional[int] = Field(default=None, ge=30, le=250)
    blood_pressure: Optional[str] = None
    spo2: Optional[int] = Field(default=None, ge=50, le=100)
    cvs: Optional[str] = Field(default=None, max_length=100)
    rs: Optional[str] = Field(default=None, max_length=100)
    jvp: Optional[str] = Field(default=None, max_length=50)
    weight: Optional[Decimal] = Field(default=None, ge=0, le=500)
    hlp: Optional[str] = Field(default=None, max_length=50)
    htn: Optional[str] = Field(default=None, max_length=50)
    dm: Optional[str] = Field(default=None, max_length=50)
    smoking: Optional[str] = Field(default=None, max_length=50)
    family_ho_cad: Optional[str] = Field(default=None, max_length=100)
    heart_disease: Optional[str] = Field(default=None, max_length=100)
    ptca_cabg: Optional[str] = Field(default=None, max_length=100)
    current_drugs: Optional[str] = None


class VitalsResponse(VitalsBase):
    """Vitals response schema."""

    id: UUID
    appointment_id: UUID
    patient_id: UUID
    recorded_by: Optional[UUID] = None
    created_at: str
    updated_at: str

    # Computed fields
    spo2_status: Optional[str] = None
    systolic: Optional[int] = None
    diastolic: Optional[int] = None

    # Joined data
    patient_name: Optional[str] = None
    patient_mr_number: Optional[str] = None
    op_number: Optional[str] = None
    recorded_by_name: Optional[str] = None

    class Config:
        from_attributes = True


class TodayVitalsResponse(BaseModel):
    """Today's vitals list for VitalsCollection.tsx."""

    items: List[VitalsResponse]
    total: int


class VitalsWithFallbackResponse(BaseModel):
    """Vitals response with fallback information.

    Used when current OP has no vitals but previous visits do.
    """

    vitals: Optional[VitalsResponse] = None
    is_old_vitals: bool = False
    source_op_number: Optional[str] = None
    visit_date: Optional[str] = None
    has_vitals: bool = False

    class Config:
        from_attributes = True
