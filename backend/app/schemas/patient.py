"""
Patient Schemas - Request/Response validation for Patient endpoints

Derived from frontend PatientRegistration.tsx form fields.
"""

from datetime import date
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, field_validator
import re


class PatientBase(BaseModel):
    """Base patient fields from frontend form."""

    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: Optional[date] = None
    gender: str = Field(..., description="Male, Female, or Other")
    marital_status: Optional[str] = None
    patient_type: Optional[str] = Field(default="New")
    phone: str = Field(..., min_length=10, max_length=15)
    email: Optional[str] = Field(default=None, max_length=255)
    emergency_contact: Optional[str] = Field(default=None, max_length=15)
    address: Optional[str] = None
    city: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    pin_code: Optional[str] = Field(default=None, max_length=10)
    blood_group: Optional[str] = Field(default=None, max_length=10)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """Validate Indian phone number format."""
        cleaned = re.sub(r"[^\d]", "", v)
        if cleaned.startswith("91") and len(cleaned) == 12:
            cleaned = cleaned[2:]
        if len(cleaned) != 10:
            raise ValueError("Phone must be 10 digits")
        if cleaned[0] not in "6789":
            raise ValueError("Phone must start with 6, 7, 8, or 9")
        return v

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v: str) -> str:
        """Validate gender value."""
        valid = ["Male", "Female", "Other"]
        if v not in valid:
            raise ValueError(f"Gender must be one of: {valid}")
        return v


class PatientCreate(PatientBase):
    """Schema for creating a new patient."""

    # Optional: Create appointment immediately
    doctor_id: Optional[UUID] = Field(default=None, description="Doctor for immediate appointment")

    class Config:
        json_schema_extra = {
            "example": {
                "first_name": "Rajesh",
                "last_name": "Kumar",
                "date_of_birth": "1980-05-15",
                "gender": "Male",
                "phone": "9876543210",
                "email": "rajesh@example.com",
                "city": "Hyderabad",
                "state": "Telangana",
            }
        }


class PatientUpdate(BaseModel):
    """Schema for updating patient information."""

    first_name: Optional[str] = Field(default=None, max_length=100)
    last_name: Optional[str] = Field(default=None, max_length=100)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    patient_type: Optional[str] = None
    phone: Optional[str] = Field(default=None, max_length=15)
    email: Optional[str] = Field(default=None, max_length=255)
    emergency_contact: Optional[str] = Field(default=None, max_length=15)
    address: Optional[str] = None
    city: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    pin_code: Optional[str] = Field(default=None, max_length=10)
    blood_group: Optional[str] = Field(default=None, max_length=10)


class PatientResponse(PatientBase):
    """Patient response schema."""

    id: UUID
    mr_number: str
    created_at: str
    updated_at: str

    # Computed fields
    full_name: Optional[str] = None
    age: Optional[int] = None
    age_gender: Optional[str] = None

    class Config:
        from_attributes = True


class PatientListResponse(BaseModel):
    """Paginated patient list response."""

    items: List[PatientResponse]
    total: int
    page: int
    page_size: int
    pages: int


class PatientSearchRequest(BaseModel):
    """Patient search request."""

    query: str = Field(..., min_length=1, description="Search query")
    search_type: str = Field(
        default="all",
        description="Search type: all, name, phone, mr_number"
    )


class PatientWithAppointmentCreate(PatientCreate):
    """Create patient with immediate appointment."""

    doctor_id: UUID = Field(..., description="Doctor for appointment")
    appointment_date: Optional[date] = Field(default=None, description="Defaults to today")
    appointment_time: Optional[str] = Field(default=None, description="HH:MM format")


class PatientSearchResponse(BaseModel):
    """Patient search results response."""

    patients: List[PatientResponse]
    total: int
    skip: int = 0
    limit: int = 20
