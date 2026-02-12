"""
Prescription Schemas - Prescription related schemas

Derived from frontend PrescriptionForm.tsx form fields.
"""

from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field


class MedicineBase(BaseModel):
    """Base medicine fields."""

    medicine_name: str = Field(..., max_length=200)
    dosage: Optional[str] = Field(default=None, max_length=100)
    frequency: Optional[str] = Field(default=None, max_length=50, description="e.g., 1-0-1")
    duration: Optional[str] = Field(default=None, max_length=50, description="e.g., 30 days")
    instructions: Optional[str] = Field(default=None, max_length=200)


class MedicineCreate(MedicineBase):
    """Schema for adding a medicine to prescription."""
    pass


class MedicineResponse(MedicineBase):
    """Medicine response schema."""

    id: UUID
    sequence_order: int

    class Config:
        from_attributes = True


class PrescriptionBase(BaseModel):
    """Base prescription fields from frontend form."""

    diagnosis: str = Field(..., min_length=1)
    complaint: Optional[str] = None
    history: Optional[str] = None
    lab_tests: Optional[str] = Field(default=None, description="Comma-separated lab tests")
    advice: Optional[str] = None
    notes: Optional[str] = None
    follow_up_days: Optional[int] = Field(default=None, ge=1, le=365)


class PrescriptionCreate(PrescriptionBase):
    """Schema for creating a prescription."""

    appointment_id: UUID
    medicines: List[MedicineCreate] = Field(default_factory=list)

    class Config:
        json_schema_extra = {
            "example": {
                "appointment_id": "550e8400-e29b-41d4-a716-446655440000",
                "diagnosis": "Hypertension",
                "complaint": "Headache, dizziness",
                "medicines": [
                    {
                        "medicine_name": "Amlodipine",
                        "dosage": "5mg",
                        "frequency": "1-0-0",
                        "duration": "30 days",
                    }
                ],
                "lab_tests": "ECG, Lipid Profile",
                "advice": "Low salt diet, regular exercise",
            }
        }


class PrescriptionUpdate(BaseModel):
    """Schema for updating a prescription."""

    diagnosis: Optional[str] = None
    complaint: Optional[str] = None
    history: Optional[str] = None
    lab_tests: Optional[str] = None
    advice: Optional[str] = None
    notes: Optional[str] = None
    follow_up_days: Optional[int] = Field(default=None, ge=1, le=365)
    medicines: Optional[List[MedicineCreate]] = None


class PrescriptionResponse(PrescriptionBase):
    """Prescription response schema."""

    id: UUID
    patient_id: UUID
    appointment_id: UUID
    doctor_id: Optional[UUID] = None
    sent_to_patient: bool
    sent_via: Optional[str] = None
    created_at: str
    updated_at: str

    # Medicines
    medicines: List[MedicineResponse] = Field(default_factory=list)

    # Joined data
    patient_name: Optional[str] = None
    patient_mr_number: Optional[str] = None
    patient_age_gender: Optional[str] = None
    doctor_name: Optional[str] = None
    op_number: Optional[str] = None

    class Config:
        from_attributes = True


class PrescriptionListResponse(BaseModel):
    """List of prescriptions."""

    items: List[PrescriptionResponse]
    total: int


class SendToLabRequest(BaseModel):
    """Request to send patient to lab."""

    lab_tests: List[str] = Field(..., min_length=1)


class SendToPharmacyRequest(BaseModel):
    """Request to send patient to pharmacy."""

    medicines: List[str] = Field(..., min_length=1)


class SendPrescriptionRequest(BaseModel):
    """Request to send prescription to patient."""

    method: str = Field(..., description="whatsapp or email")

    class Config:
        json_schema_extra = {
            "example": {"method": "whatsapp"}
        }


class SendPrescriptionEmailRequest(BaseModel):
    """Request to send prescription via email."""

    email: str = Field(..., description="Recipient email address")


class SendPrescriptionWhatsAppRequest(BaseModel):
    """Request to send prescription via WhatsApp."""

    phone: str = Field(..., description="Recipient phone number")
