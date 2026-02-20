"""
Admin Schemas - Medicine Master and Admin Management

Used by admin module for managing medicines, users, and system settings.
"""

from typing import Optional, List
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field


# ============================================================
# Medicine Master Schemas
# ============================================================

class MedicineMasterBase(BaseModel):
    """Base medicine master fields."""

    code: str = Field(..., max_length=50, description="Unique medicine code")
    name: str = Field(..., max_length=255, description="Medicine brand name")
    generic_name: Optional[str] = Field(None, max_length=255, description="Generic/chemical name")
    category: Optional[str] = Field(None, max_length=100, description="Medicine category")
    specialization: Optional[str] = Field(None, max_length=100, description="Medical specialization")
    dosage_form: Optional[str] = Field(None, max_length=50, description="Form of medicine")
    strength: Optional[str] = Field(None, max_length=50, description="Strength/dosage")
    manufacturer: Optional[str] = Field(None, max_length=200, description="Manufacturer name")


class MedicineMasterCreate(MedicineMasterBase):
    """Schema for creating a medicine."""
    pass


class MedicineMasterUpdate(BaseModel):
    """Schema for updating a medicine."""

    code: Optional[str] = Field(None, max_length=50)
    name: Optional[str] = Field(None, max_length=255)
    generic_name: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    specialization: Optional[str] = Field(None, max_length=100)
    dosage_form: Optional[str] = Field(None, max_length=50)
    strength: Optional[str] = Field(None, max_length=50)
    manufacturer: Optional[str] = Field(None, max_length=200)
    is_active: Optional[bool] = None


class MedicineMasterResponse(MedicineMasterBase):
    """Medicine response schema."""

    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MedicineMasterListResponse(BaseModel):
    """List of medicines with pagination."""

    items: List[MedicineMasterResponse]
    total: int
    page: int = 1
    page_size: int = 50


class MedicineMasterBulkCreate(BaseModel):
    """Schema for bulk importing medicines."""

    medicines: List[MedicineMasterCreate]


# ============================================================
# Admin User Management Schemas
# ============================================================

class AdminUserResponse(BaseModel):
    """User response for admin listing."""

    id: UUID
    username: str
    display_name: str
    email: Optional[str] = None
    role: str
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AdminUserListResponse(BaseModel):
    """List of users with pagination."""

    items: List[AdminUserResponse]
    total: int
    page: int = 1
    page_size: int = 50


class AdminUserStatusUpdate(BaseModel):
    """Schema for activating/deactivating user."""

    is_active: bool


# ============================================================
# Admin Doctor Management Schemas
# ============================================================

class AdminDoctorResponse(BaseModel):
    """Doctor response for admin listing."""

    id: UUID
    name: str
    registration_number: Optional[str] = None
    qualification: Optional[str] = None
    speciality: Optional[str] = None
    consultation_fee: Optional[float] = None
    department_id: Optional[UUID] = None
    department_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    room: Optional[str] = None
    is_available: bool
    user_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AdminDoctorListResponse(BaseModel):
    """List of doctors with pagination."""

    items: List[AdminDoctorResponse]
    total: int
    page: int = 1
    page_size: int = 50


# ============================================================
# Admin Department Management Schemas
# ============================================================

class AdminDepartmentCreate(BaseModel):
    """Schema for creating a department."""

    name: str = Field(..., max_length=100, description="Department name")
    code: str = Field(..., max_length=20, description="Unique department code")
    description: Optional[str] = Field(None, max_length=500, description="Department description")
    base_consultation_fee: float = Field(default=300.00, ge=0, description="Base consultation fee")


class AdminDepartmentUpdate(BaseModel):
    """Schema for updating a department."""

    name: Optional[str] = Field(None, max_length=100)
    code: Optional[str] = Field(None, max_length=20)
    description: Optional[str] = Field(None, max_length=500)
    base_consultation_fee: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None


class AdminDepartmentResponse(BaseModel):
    """Department response for admin listing."""

    id: UUID
    name: str
    code: str
    description: Optional[str] = None
    base_consultation_fee: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AdminDepartmentListResponse(BaseModel):
    """List of departments with pagination."""

    items: List[AdminDepartmentResponse]
    total: int
    page: int = 1
    page_size: int = 50
