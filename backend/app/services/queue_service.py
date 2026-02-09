"""
Queue Service - Lab and Pharmacy queue operations
"""

from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.repositories.queue_repository import LabQueueRepository, PharmacyQueueRepository
from app.repositories.appointment_repository import AppointmentRepository
from app.models.queue import LabQueueItem, PharmacyQueueItem, QueueStatus
from app.schemas.queue import (
    LabQueueCreate,
    LabQueueResponse,
    PharmacyQueueCreate,
    PharmacyQueueResponse,
)


class LabQueueService:
    """Service for lab queue operations."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = LabQueueRepository(db)
        self.appointment_repo = AppointmentRepository(db)

    def add_to_queue(self, data: LabQueueCreate) -> LabQueueItem:
        """Add patient to lab queue."""
        appointment = self.appointment_repo.get_with_details(data.appointment_id)
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found",
            )

        patient = appointment.patient
        queue_data = {
            "appointment_id": data.appointment_id,
            "patient_id": patient.id,
            "patient_name": f"{patient.first_name} {patient.last_name}",
            "mr_number": patient.mr_number,
            "op_number": appointment.op_number,
            "token_number": appointment.token_number,
            "lab_tests": data.lab_tests,
            "notes": data.notes,
            "status": QueueStatus.PENDING,
        }
        return self.repo.create(queue_data)

    def get_pending_queue(self) -> List[LabQueueItem]:
        """Get pending lab queue items."""
        return self.repo.get_pending_queue()

    def get_today_queue(self) -> List[LabQueueItem]:
        """Get today's lab queue."""
        return self.repo.get_today_queue()

    def get_by_appointment(self, appointment_id: UUID) -> Optional[LabQueueItem]:
        """Get lab queue item by appointment."""
        item = self.repo.get_by_appointment(appointment_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lab queue item not found",
            )
        return item

    def get_queue_item(self, item_id: UUID) -> LabQueueItem:
        """Get lab queue item by ID."""
        item = self.repo.get_by_id(item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lab queue item not found",
            )
        return item

    def start_processing(self, item_id: UUID) -> LabQueueItem:
        """Mark item as in progress."""
        item = self.repo.update_status(item_id, QueueStatus.IN_PROGRESS)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lab queue item not found",
            )
        return item

    def complete_item(self, item_id: UUID) -> LabQueueItem:
        """Mark item as completed."""
        item = self.repo.update_status(item_id, QueueStatus.COMPLETED)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lab queue item not found",
            )
        return item

    def cancel_item(self, item_id: UUID) -> LabQueueItem:
        """Cancel a queue item."""
        item = self.repo.update_status(item_id, QueueStatus.CANCELLED)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lab queue item not found",
            )
        return item

    def build_response(self, item: LabQueueItem) -> LabQueueResponse:
        """Build lab queue response."""
        return LabQueueResponse(
            id=item.id,
            appointment_id=item.appointment_id,
            patient_id=item.patient_id,
            patient_name=item.patient_name,
            mr_number=item.mr_number,
            op_number=item.op_number,
            token_number=item.token_number,
            lab_tests=item.lab_tests or [],
            status=item.status.value,
            collected_at=item.collected_at,
            completed_at=item.completed_at,
            notes=item.notes,
            created_at=item.created_at.isoformat() if item.created_at else None,
        )


class PharmacyQueueService:
    """Service for pharmacy queue operations."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = PharmacyQueueRepository(db)
        self.appointment_repo = AppointmentRepository(db)

    def add_to_queue(self, data: PharmacyQueueCreate) -> PharmacyQueueItem:
        """Add patient to pharmacy queue."""
        appointment = self.appointment_repo.get_with_details(data.appointment_id)
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found",
            )

        patient = appointment.patient
        queue_data = {
            "appointment_id": data.appointment_id,
            "patient_id": patient.id,
            "patient_name": f"{patient.first_name} {patient.last_name}",
            "mr_number": patient.mr_number,
            "op_number": appointment.op_number,
            "token_number": appointment.token_number,
            "medicines": data.medicines,
            "notes": data.notes,
            "status": QueueStatus.PENDING,
        }
        return self.repo.create(queue_data)

    def get_pending_queue(self) -> List[PharmacyQueueItem]:
        """Get pending pharmacy queue items."""
        return self.repo.get_pending_queue()

    def get_today_queue(self) -> List[PharmacyQueueItem]:
        """Get today's pharmacy queue."""
        return self.repo.get_today_queue()

    def get_by_appointment(self, appointment_id: UUID) -> Optional[PharmacyQueueItem]:
        """Get pharmacy queue item by appointment."""
        item = self.repo.get_by_appointment(appointment_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pharmacy queue item not found",
            )
        return item

    def get_queue_item(self, item_id: UUID) -> PharmacyQueueItem:
        """Get pharmacy queue item by ID."""
        item = self.repo.get_by_id(item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pharmacy queue item not found",
            )
        return item

    def start_processing(self, item_id: UUID) -> PharmacyQueueItem:
        """Mark item as in progress."""
        item = self.repo.update_status(item_id, QueueStatus.IN_PROGRESS)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pharmacy queue item not found",
            )
        return item

    def complete_item(self, item_id: UUID) -> PharmacyQueueItem:
        """Mark item as completed."""
        item = self.repo.update_status(item_id, QueueStatus.COMPLETED)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pharmacy queue item not found",
            )
        return item

    def cancel_item(self, item_id: UUID) -> PharmacyQueueItem:
        """Cancel a queue item."""
        item = self.repo.update_status(item_id, QueueStatus.CANCELLED)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pharmacy queue item not found",
            )
        return item

    def build_response(self, item: PharmacyQueueItem) -> PharmacyQueueResponse:
        """Build pharmacy queue response."""
        return PharmacyQueueResponse(
            id=item.id,
            appointment_id=item.appointment_id,
            patient_id=item.patient_id,
            patient_name=item.patient_name,
            mr_number=item.mr_number,
            op_number=item.op_number,
            token_number=item.token_number,
            medicines=item.medicines or [],
            status=item.status.value,
            dispensed_at=item.dispensed_at,
            completed_at=item.completed_at,
            notes=item.notes,
            created_at=item.created_at.isoformat() if item.created_at else None,
        )
