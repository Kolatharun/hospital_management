"""
Queue Repository - Lab and Pharmacy queue database operations
"""

from datetime import date
from typing import Optional, List, Dict
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.repositories.base import BaseRepository
from app.models.queue import LabQueueItem, PharmacyQueueItem, QueueStatus


class LabQueueRepository(BaseRepository[LabQueueItem]):
    """Repository for LabQueueItem model operations."""

    def __init__(self, db: Session):
        super().__init__(LabQueueItem, db)

    def get_by_appointment(self, appointment_id: UUID) -> Optional[LabQueueItem]:
        """Get lab queue item for an appointment."""
        return self.db.query(LabQueueItem).filter(
            LabQueueItem.appointment_id == appointment_id,
            LabQueueItem.is_deleted == False,
        ).first()

    def get_today_queue(self, status: Optional[QueueStatus] = None) -> List[LabQueueItem]:
        """Get today's lab queue."""
        today = date.today()
        query = self.db.query(LabQueueItem).filter(
            func.date(LabQueueItem.created_at) == today,
            LabQueueItem.is_deleted == False,
        )
        if status:
            query = query.filter(LabQueueItem.status == status)
        return query.order_by(LabQueueItem.token_number).all()

    def get_queue_stats(self) -> Dict[str, int]:
        """Get lab queue statistics for today."""
        today = date.today()
        items = self.db.query(LabQueueItem).filter(
            func.date(LabQueueItem.created_at) == today,
            LabQueueItem.is_deleted == False,
        ).all()

        return {
            "total": len(items),
            "waiting": sum(1 for i in items if i.status == QueueStatus.WAITING),
            "in_progress": sum(1 for i in items if i.status == QueueStatus.IN_PROGRESS),
            "completed": sum(1 for i in items if i.status == QueueStatus.COMPLETED),
        }

    def get_next_token(self) -> int:
        """Get next lab queue token number for today."""
        today = date.today()
        result = self.db.query(func.max(LabQueueItem.token_number)).filter(
            func.date(LabQueueItem.created_at) == today,
        ).scalar()
        return (result or 0) + 1


class PharmacyQueueRepository(BaseRepository[PharmacyQueueItem]):
    """Repository for PharmacyQueueItem model operations."""

    def __init__(self, db: Session):
        super().__init__(PharmacyQueueItem, db)

    def get_by_appointment(self, appointment_id: UUID) -> Optional[PharmacyQueueItem]:
        """Get pharmacy queue item for an appointment."""
        return self.db.query(PharmacyQueueItem).filter(
            PharmacyQueueItem.appointment_id == appointment_id,
            PharmacyQueueItem.is_deleted == False,
        ).first()

    def get_today_queue(self, status: Optional[QueueStatus] = None) -> List[PharmacyQueueItem]:
        """Get today's pharmacy queue."""
        today = date.today()
        query = self.db.query(PharmacyQueueItem).filter(
            func.date(PharmacyQueueItem.created_at) == today,
            PharmacyQueueItem.is_deleted == False,
        )
        if status:
            query = query.filter(PharmacyQueueItem.status == status)
        return query.order_by(PharmacyQueueItem.token_number).all()

    def get_queue_stats(self) -> Dict[str, int]:
        """Get pharmacy queue statistics for today."""
        today = date.today()
        items = self.db.query(PharmacyQueueItem).filter(
            func.date(PharmacyQueueItem.created_at) == today,
            PharmacyQueueItem.is_deleted == False,
        ).all()

        return {
            "total": len(items),
            "waiting": sum(1 for i in items if i.status == QueueStatus.WAITING),
            "in_progress": sum(1 for i in items if i.status == QueueStatus.IN_PROGRESS),
            "completed": sum(1 for i in items if i.status == QueueStatus.COMPLETED),
        }

    def get_next_token(self) -> int:
        """Get next pharmacy queue token number for today."""
        today = date.today()
        result = self.db.query(func.max(PharmacyQueueItem.token_number)).filter(
            func.date(PharmacyQueueItem.created_at) == today,
        ).scalar()
        return (result or 0) + 1
