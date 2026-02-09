"""
Vitals Repository - Patient vitals database operations
"""

from datetime import date
from typing import Optional, List
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.repositories.base import BaseRepository
from app.models.vitals import PatientVitals


class VitalsRepository(BaseRepository[PatientVitals]):
    """Repository for PatientVitals model operations."""

    def __init__(self, db: Session):
        super().__init__(PatientVitals, db)

    def get_by_appointment(self, appointment_id: UUID) -> Optional[PatientVitals]:
        """Get vitals for an appointment."""
        return self.db.query(PatientVitals).options(
            joinedload(PatientVitals.patient),
            joinedload(PatientVitals.appointment),
        ).filter(
            PatientVitals.appointment_id == appointment_id,
            PatientVitals.is_deleted == False,
        ).first()

    def get_patient_vitals(
        self,
        patient_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> List[PatientVitals]:
        """Get vitals history for a patient."""
        return self.db.query(PatientVitals).options(
            joinedload(PatientVitals.appointment),
        ).filter(
            PatientVitals.patient_id == patient_id,
            PatientVitals.is_deleted == False,
        ).order_by(PatientVitals.created_at.desc()).offset(skip).limit(limit).all()

    def get_today_vitals(self) -> List[PatientVitals]:
        """Get all vitals recorded today."""
        today = date.today()
        return self.db.query(PatientVitals).options(
            joinedload(PatientVitals.patient),
            joinedload(PatientVitals.appointment),
        ).filter(
            func.date(PatientVitals.created_at) == today,
            PatientVitals.is_deleted == False,
        ).order_by(PatientVitals.created_at.desc()).all()

    def appointment_has_vitals(self, appointment_id: UUID) -> bool:
        """Check if appointment already has vitals recorded."""
        return self.db.query(PatientVitals.id).filter(
            PatientVitals.appointment_id == appointment_id,
            PatientVitals.is_deleted == False,
        ).first() is not None
