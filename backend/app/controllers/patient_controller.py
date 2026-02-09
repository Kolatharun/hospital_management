"""
Patient Controller - Patient registration and management endpoints
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.services.patient_service import PatientService
from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientSearchResponse,
)

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("", response_model=PatientResponse)
def register_patient(
    data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Register a new patient."""
    service = PatientService(db)
    patient = service.register_patient(data)
    return service.build_response(patient)


@router.get("/search", response_model=PatientSearchResponse)
def search_patients(
    q: str = Query(..., min_length=1, description="Search query"),
    search_type: str = Query("all", description="Search type: all, name, phone, mr_number"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search patients by name, phone, or MR number."""
    service = PatientService(db)
    patients, total = service.search_patients(q, search_type, skip, limit)
    return PatientSearchResponse(
        patients=[service.build_response(p) for p in patients],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/recent", response_model=list[PatientResponse])
def get_recent_registrations(
    days: int = Query(7, ge=1, le=30),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get recently registered patients."""
    service = PatientService(db)
    patients = service.get_recent_registrations(days, skip, limit)
    return [service.build_response(p) for p in patients]


@router.get("/today", response_model=list[PatientResponse])
def get_today_registrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get patients registered today."""
    service = PatientService(db)
    patients = service.get_today_registrations()
    return [service.build_response(p) for p in patients]


@router.get("/mr/{mr_number}", response_model=PatientResponse)
def get_patient_by_mr(
    mr_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get patient by MR number."""
    service = PatientService(db)
    patient = service.get_by_mr_number(mr_number)
    return service.build_response(patient)


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get patient by ID."""
    service = PatientService(db)
    patient = service.get_patient(patient_id)
    return service.build_response(patient)


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: UUID,
    data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Update patient information."""
    service = PatientService(db)
    patient = service.update_patient(patient_id, data)
    return service.build_response(patient)


@router.delete("/{patient_id}")
def delete_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Soft delete a patient."""
    service = PatientService(db)
    service.delete_patient(patient_id)
    return {"message": "Patient deleted successfully"}
