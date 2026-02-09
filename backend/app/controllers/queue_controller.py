"""
Queue Controller - Lab and Pharmacy queue management endpoints
"""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.services.queue_service import LabQueueService, PharmacyQueueService
from app.schemas.queue import (
    LabQueueCreate,
    LabQueueResponse,
    PharmacyQueueCreate,
    PharmacyQueueResponse,
)

router = APIRouter(tags=["Queues"])


# Lab Queue endpoints
@router.post("/lab-queue", response_model=LabQueueResponse)
def add_to_lab_queue(
    data: LabQueueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.DOCTOR])),
):
    """Add patient to lab queue."""
    service = LabQueueService(db)
    item = service.add_to_queue(data)
    return service.build_response(item)


@router.get("/lab-queue", response_model=list[LabQueueResponse])
def get_lab_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get today's lab queue."""
    service = LabQueueService(db)
    items = service.get_today_queue()
    return [service.build_response(i) for i in items]


@router.get("/lab-queue/pending", response_model=list[LabQueueResponse])
def get_pending_lab_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get pending lab queue items."""
    service = LabQueueService(db)
    items = service.get_pending_queue()
    return [service.build_response(i) for i in items]


@router.get("/lab-queue/appointment/{appointment_id}", response_model=LabQueueResponse)
def get_lab_queue_by_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get lab queue item by appointment."""
    service = LabQueueService(db)
    item = service.get_by_appointment(appointment_id)
    return service.build_response(item)


@router.get("/lab-queue/{item_id}", response_model=LabQueueResponse)
def get_lab_queue_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get lab queue item by ID."""
    service = LabQueueService(db)
    item = service.get_queue_item(item_id)
    return service.build_response(item)


@router.post("/lab-queue/{item_id}/start", response_model=LabQueueResponse)
def start_lab_processing(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start processing a lab queue item."""
    service = LabQueueService(db)
    item = service.start_processing(item_id)
    return service.build_response(item)


@router.post("/lab-queue/{item_id}/complete", response_model=LabQueueResponse)
def complete_lab_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark lab queue item as completed."""
    service = LabQueueService(db)
    item = service.complete_item(item_id)
    return service.build_response(item)


@router.post("/lab-queue/{item_id}/cancel", response_model=LabQueueResponse)
def cancel_lab_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel a lab queue item."""
    service = LabQueueService(db)
    item = service.cancel_item(item_id)
    return service.build_response(item)


# Pharmacy Queue endpoints
@router.post("/pharmacy-queue", response_model=PharmacyQueueResponse)
def add_to_pharmacy_queue(
    data: PharmacyQueueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.DOCTOR])),
):
    """Add patient to pharmacy queue."""
    service = PharmacyQueueService(db)
    item = service.add_to_queue(data)
    return service.build_response(item)


@router.get("/pharmacy-queue", response_model=list[PharmacyQueueResponse])
def get_pharmacy_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get today's pharmacy queue."""
    service = PharmacyQueueService(db)
    items = service.get_today_queue()
    return [service.build_response(i) for i in items]


@router.get("/pharmacy-queue/pending", response_model=list[PharmacyQueueResponse])
def get_pending_pharmacy_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get pending pharmacy queue items."""
    service = PharmacyQueueService(db)
    items = service.get_pending_queue()
    return [service.build_response(i) for i in items]


@router.get("/pharmacy-queue/appointment/{appointment_id}", response_model=PharmacyQueueResponse)
def get_pharmacy_queue_by_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get pharmacy queue item by appointment."""
    service = PharmacyQueueService(db)
    item = service.get_by_appointment(appointment_id)
    return service.build_response(item)


@router.get("/pharmacy-queue/{item_id}", response_model=PharmacyQueueResponse)
def get_pharmacy_queue_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get pharmacy queue item by ID."""
    service = PharmacyQueueService(db)
    item = service.get_queue_item(item_id)
    return service.build_response(item)


@router.post("/pharmacy-queue/{item_id}/start", response_model=PharmacyQueueResponse)
def start_pharmacy_processing(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start processing a pharmacy queue item."""
    service = PharmacyQueueService(db)
    item = service.start_processing(item_id)
    return service.build_response(item)


@router.post("/pharmacy-queue/{item_id}/complete", response_model=PharmacyQueueResponse)
def complete_pharmacy_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark pharmacy queue item as completed."""
    service = PharmacyQueueService(db)
    item = service.complete_item(item_id)
    return service.build_response(item)


@router.post("/pharmacy-queue/{item_id}/cancel", response_model=PharmacyQueueResponse)
def cancel_pharmacy_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel a pharmacy queue item."""
    service = PharmacyQueueService(db)
    item = service.cancel_item(item_id)
    return service.build_response(item)
