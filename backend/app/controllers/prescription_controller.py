"""
Prescription Controller - Doctor prescription management endpoints
"""

from typing import Optional
from uuid import UUID
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles, get_current_doctor
from app.models.user import User, UserRole
from app.models.doctor import Doctor
from app.services.prescription_service import PrescriptionService
from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionUpdate,
    PrescriptionResponse,
    SendToLabRequest,
    SendToPharmacyRequest,
    SendPrescriptionRequest,
)

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])


@router.post("", response_model=PrescriptionResponse)
def create_prescription(
    data: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """Create a new prescription for an appointment (Doctor only)."""
    service = PrescriptionService(db)
    prescription = service.create_prescription(data, current_doctor.id)
    return service.build_response(prescription)


@router.get("/today", response_model=list[PrescriptionResponse])
def get_today_prescriptions(
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """Get prescriptions created today by current doctor."""
    service = PrescriptionService(db)
    prescriptions = service.get_today_prescriptions(current_doctor.id)
    return [service.build_response(p) for p in prescriptions]


@router.get("/my", response_model=list[PrescriptionResponse])
def get_my_prescriptions(
    target_date: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """Get prescriptions created by current doctor."""
    service = PrescriptionService(db)
    prescriptions = service.get_doctor_prescriptions(current_doctor.id, target_date, skip, limit)
    return [service.build_response(p) for p in prescriptions]


@router.get("/appointment/{appointment_id}", response_model=PrescriptionResponse)
def get_appointment_prescription(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get prescription for a specific appointment."""
    service = PrescriptionService(db)
    prescription = service.get_by_appointment(appointment_id)
    return service.build_response(prescription)


@router.get("/patient/{patient_id}", response_model=list[PrescriptionResponse])
def get_patient_prescriptions(
    patient_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get prescription history for a patient."""
    service = PrescriptionService(db)
    prescriptions = service.get_patient_prescriptions(patient_id, skip, limit)
    return [service.build_response(p) for p in prescriptions]


@router.get("/{prescription_id}", response_model=PrescriptionResponse)
def get_prescription(
    prescription_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get prescription by ID."""
    service = PrescriptionService(db)
    prescription = service.get_prescription(prescription_id)
    return service.build_response(prescription)


@router.put("/{prescription_id}", response_model=PrescriptionResponse)
def update_prescription(
    prescription_id: UUID,
    data: PrescriptionUpdate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """Update a prescription (Doctor only, own prescriptions)."""
    service = PrescriptionService(db)
    prescription = service.update_prescription(prescription_id, data, current_doctor.id)
    return service.build_response(prescription)


@router.post("/{prescription_id}/send-to-lab")
def send_to_lab(
    prescription_id: UUID,
    data: SendToLabRequest,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """Send patient to lab queue with tests."""
    service = PrescriptionService(db)
    return service.send_to_lab(prescription_id, data.lab_tests)


@router.post("/{prescription_id}/send-to-pharmacy")
def send_to_pharmacy(
    prescription_id: UUID,
    data: SendToPharmacyRequest,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """Send patient to pharmacy queue with medicines."""
    service = PrescriptionService(db)
    return service.send_to_pharmacy(prescription_id, data.medicines)


@router.post("/{prescription_id}/send-to-patient", response_model=PrescriptionResponse)
def send_to_patient(
    prescription_id: UUID,
    data: SendPrescriptionRequest,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """Send prescription to patient via WhatsApp or email."""
    service = PrescriptionService(db)
    prescription = service.send_to_patient(prescription_id, data.method)
    return service.build_response(prescription)
