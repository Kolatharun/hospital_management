"""
Document Repository - Patient document database operations
"""

from datetime import date, datetime, timedelta
from typing import List, Optional
from uuid import UUID

from sqlalchemy import func, and_
from sqlalchemy.orm import Session, joinedload

from app.repositories.base import BaseRepository
from app.models.document import PatientDocument


class DocumentRepository(BaseRepository[PatientDocument]):
    """Repository for patient document operations."""

    def __init__(self, db: Session):
        super().__init__(PatientDocument, db)

    def get_by_patient(
        self,
        patient_id: UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> List[PatientDocument]:
        """Get all documents for a patient."""
        return (
            self.db.query(PatientDocument)
            .filter(
                PatientDocument.patient_id == patient_id,
                PatientDocument.is_deleted == False,
            )
            .order_by(PatientDocument.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_by_patient(self, patient_id: UUID) -> int:
        """Count documents for a patient."""
        return (
            self.db.query(func.count(PatientDocument.id))
            .filter(
                PatientDocument.patient_id == patient_id,
                PatientDocument.is_deleted == False,
            )
            .scalar() or 0
        )

    def get_by_appointment(
        self,
        appointment_id: UUID,
    ) -> List[PatientDocument]:
        """Get all documents for an appointment."""
        return (
            self.db.query(PatientDocument)
            .filter(
                PatientDocument.appointment_id == appointment_id,
                PatientDocument.is_deleted == False,
            )
            .order_by(PatientDocument.created_at.desc())
            .all()
        )

    def get_today_uploads(self) -> List[PatientDocument]:
        """Get all documents uploaded today."""
        today = date.today()
        return (
            self.db.query(PatientDocument)
            .filter(
                func.date(PatientDocument.created_at) == today,
                PatientDocument.is_deleted == False,
            )
            .order_by(PatientDocument.created_at.desc())
            .all()
        )

    def get_by_document_type(
        self,
        patient_id: UUID,
        document_type: str,
    ) -> List[PatientDocument]:
        """Get documents of a specific type for a patient."""
        return (
            self.db.query(PatientDocument)
            .filter(
                PatientDocument.patient_id == patient_id,
                PatientDocument.document_type == document_type,
                PatientDocument.is_deleted == False,
            )
            .order_by(PatientDocument.created_at.desc())
            .all()
        )
