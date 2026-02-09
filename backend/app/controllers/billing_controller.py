"""
Billing Controller - Bill management and payment endpoints
"""

from typing import Optional
from uuid import UUID
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.services.billing_service import BillingService
from app.schemas.billing import (
    BillCreate,
    BillUpdate,
    BillResponse,
    PaymentRecord,
    DaySummaryResponse,
)

router = APIRouter(prefix="/billing", tags=["Billing"])


@router.post("", response_model=BillResponse)
def create_bill(
    data: BillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Create a new bill for an appointment."""
    service = BillingService(db)
    bill = service.create_bill(data, current_user)
    return service.build_response(bill)


@router.get("/today", response_model=list[BillResponse])
def get_today_bills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all bills for today."""
    service = BillingService(db)
    bills = service.get_today_bills()
    return [service.build_response(b) for b in bills]


@router.get("/summary", response_model=DaySummaryResponse)
def get_day_summary(
    target_date: Optional[date] = Query(None, description="Date for summary, defaults to today"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Get billing summary for a day."""
    service = BillingService(db)
    return service.get_day_summary(target_date)


@router.get("/pending", response_model=list[BillResponse])
def get_pending_bills(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Get all pending (unpaid) bills for today."""
    service = BillingService(db)
    bills = service.get_pending_bills()
    return [service.build_response(b) for b in bills]


@router.get("/appointment/{appointment_id}", response_model=BillResponse)
def get_appointment_bill(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get bill for a specific appointment."""
    service = BillingService(db)
    bill = service.get_by_appointment(appointment_id)
    return service.build_response(bill)


@router.get("/patient/{patient_id}", response_model=list[BillResponse])
def get_patient_bills(
    patient_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get billing history for a patient."""
    service = BillingService(db)
    bills = service.get_patient_bills(patient_id, skip, limit)
    return [service.build_response(b) for b in bills]


@router.get("/search", response_model=list[BillResponse])
def search_bills(
    query: Optional[str] = Query(None, description="Search text for patient name, MR number, bill number"),
    patient_id: Optional[UUID] = Query(None, description="Filter by patient ID"),
    mr_number: Optional[str] = Query(None, description="Filter by MR number"),
    bill_number: Optional[str] = Query(None, description="Filter by bill number"),
    from_date: Optional[date] = Query(None, description="Filter bills from this date"),
    to_date: Optional[date] = Query(None, description="Filter bills up to this date"),
    payment_status: Optional[str] = Query(None, description="Filter by payment status (pending, partial, paid)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search bills with various filters."""
    service = BillingService(db)
    bills = service.search_bills(
        query=query,
        patient_id=patient_id,
        mr_number=mr_number,
        bill_number=bill_number,
        from_date=from_date,
        to_date=to_date,
        payment_status=payment_status,
        skip=skip,
        limit=limit,
    )
    return [service.build_response(b) for b in bills]


@router.get("/{bill_id}", response_model=BillResponse)
def get_bill(
    bill_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get bill by ID."""
    service = BillingService(db)
    bill = service.get_bill(bill_id)
    return service.build_response(bill)


@router.post("/{bill_id}/payment", response_model=BillResponse)
def record_payment(
    bill_id: UUID,
    data: PaymentRecord,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Record payment for a bill."""
    service = BillingService(db)
    bill = service.record_payment(bill_id, data)
    return service.build_response(bill)


@router.put("/{bill_id}", response_model=BillResponse)
def update_bill(
    bill_id: UUID,
    data: BillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Update an existing bill."""
    service = BillingService(db)
    bill = service.update_bill(bill_id, data)
    return service.build_response(bill)
