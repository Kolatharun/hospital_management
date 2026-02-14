"""
Vitals Controller - Patient vitals recording endpoints
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.services.vitals_service import VitalsService
from app.schemas.vitals import (
    VitalsCreate,
    VitalsUpdate,
    VitalsResponse,
    VitalsWithFallbackResponse,
)

router = APIRouter(prefix="/vitals", tags=["Vitals"])


@router.post("", response_model=VitalsResponse)
def record_vitals(
    data: VitalsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Record patient vitals for an appointment."""
    service = VitalsService(db)
    vitals = service.record_vitals(data, current_user)
    return service.build_response(vitals)


@router.get("/today", response_model=list[VitalsResponse])
def get_today_vitals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all vitals recorded today."""
    service = VitalsService(db)
    vitals_list = service.get_today_vitals()
    return [service.build_response(v) for v in vitals_list]


@router.get("/appointment/{appointment_id}", response_model=VitalsResponse)
def get_appointment_vitals(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get vitals for a specific appointment."""
    service = VitalsService(db)
    vitals = service.get_by_appointment(appointment_id)
    return service.build_response(vitals)


@router.get("/appointment/{appointment_id}/with-fallback", response_model=VitalsWithFallbackResponse)
def get_appointment_vitals_with_fallback(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get vitals for an appointment with fallback to previous visits.

    Logic:
    1. If current OP has vitals -> return them (is_old_vitals=False)
    2. If no vitals for current OP, check previous visits for same MR number
    3. If previous vitals found -> return most recent (is_old_vitals=True)
    4. If no vitals at all -> return has_vitals=False
    """
    service = VitalsService(db)
    return service.get_vitals_with_fallback(appointment_id)


@router.get("/patient/{patient_id}", response_model=list[VitalsResponse])
def get_patient_vitals_history(
    patient_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get vitals history for a patient."""
    service = VitalsService(db)
    vitals_list = service.get_patient_vitals(patient_id, skip, limit)
    return [service.build_response(v) for v in vitals_list]


@router.get("/{vitals_id}", response_model=VitalsResponse)
def get_vitals(
    vitals_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get vitals by ID."""
    service = VitalsService(db)
    vitals = service.get_vitals(vitals_id)
    return service.build_response(vitals)


@router.put("/{vitals_id}", response_model=VitalsResponse)
def update_vitals(
    vitals_id: UUID,
    data: VitalsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Update recorded vitals."""
    service = VitalsService(db)
    vitals = service.update_vitals(vitals_id, data)
    return service.build_response(vitals)
