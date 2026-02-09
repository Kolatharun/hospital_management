"""
Department Schemas - Department and Doctor related schemas

Derived from frontend PatientRegistration.tsx department dropdown.
"""

from decimal import Decimal
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field


class DepartmentBase(BaseModel):
    """Base department fields."""

    name: str = Field(..., max_length=100)
    code: str = Field(..., max_length=20)
    description: Optional[str] = Field(default=None, max_length=500)
    base_consultation_fee: Decimal = Field(default=Decimal("300.00"))


class DepartmentCreate(DepartmentBase):
    """Schema for creating a department."""
    pass


class DepartmentUpdate(BaseModel):
    """Schema for updating a department."""

    name: Optional[str] = Field(default=None, max_length=100)
    code: Optional[str] = Field(default=None, max_length=20)
    description: Optional[str] = Field(default=None, max_length=500)
    base_consultation_fee: Optional[Decimal] = None
    is_active: Optional[bool] = None


class DepartmentResponse(DepartmentBase):
    """Department response schema."""

    id: UUID
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True


class DepartmentListResponse(BaseModel):
    """List of departments."""

    items: List[DepartmentResponse]
    total: int


# Doctor schemas
class DoctorBase(BaseModel):
    """Base doctor fields."""

    name: str = Field(..., max_length=200)
    speciality: Optional[str] = Field(default=None, max_length=100)
    qualification: Optional[str] = Field(default=None, max_length=200)
    registration_number: Optional[str] = Field(default=None, max_length=50)
    phone: Optional[str] = Field(default=None, max_length=15)
    email: Optional[str] = Field(default=None, max_length=255)
    room: Optional[str] = Field(default=None, max_length=20)
    consultation_fee: Optional[Decimal] = None


class DoctorCreate(DoctorBase):
    """Schema for creating a doctor."""

    department_id: Optional[UUID] = None
    user_id: Optional[UUID] = None


class DoctorUpdate(BaseModel):
    """Schema for updating a doctor."""

    name: Optional[str] = Field(default=None, max_length=200)
    department_id: Optional[UUID] = None
    speciality: Optional[str] = Field(default=None, max_length=100)
    qualification: Optional[str] = Field(default=None, max_length=200)
    registration_number: Optional[str] = Field(default=None, max_length=50)
    phone: Optional[str] = Field(default=None, max_length=15)
    email: Optional[str] = Field(default=None, max_length=255)
    room: Optional[str] = Field(default=None, max_length=20)
    consultation_fee: Optional[Decimal] = None
    is_available: Optional[bool] = None


class DoctorResponse(DoctorBase):
    """Doctor response schema."""

    id: UUID
    department_id: Optional[UUID] = None
    department_name: Optional[str] = None
    user_id: Optional[UUID] = None
    is_available: bool
    effective_fee: Decimal  # consultation_fee or department fee
    created_at: str

    class Config:
        from_attributes = True


class DoctorListResponse(BaseModel):
    """List of doctors."""

    items: List[DoctorResponse]
    total: int


class DoctorsByDepartmentResponse(BaseModel):
    """Doctors grouped by department for frontend dropdown."""

    department_id: UUID
    department_name: str
    doctors: List[DoctorResponse]
