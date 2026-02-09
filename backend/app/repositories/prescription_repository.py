"""
Prescription Repository - Prescription database operations
"""

from datetime import date
from typing import Optional, List
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.repositories.base import BaseRepository
from app.models.prescription import Prescription, PrescriptionMedicine


class PrescriptionRepository(BaseRepository[Prescription]):
    """Repository for Prescription model operations."""

    def __init__(self, db: Session):
        super().__init__(Prescription, db)

    def get_with_details(self, prescription_id: UUID) -> Optional[Prescription]:
        """Get prescription with patient, doctor, and medicines."""
        return self.db.query(Prescription).options(
            joinedload(Prescription.patient),
            joinedload(Prescription.doctor),
            joinedload(Prescription.appointment),
            joinedload(Prescription.medicines),
        ).filter(
            Prescription.id == prescription_id,
            Prescription.is_deleted == False,
        ).first()

    def get_by_appointment(self, appointment_id: UUID) -> Optional[Prescription]:
        """Get prescription for an appointment."""
        return self.db.query(Prescription).options(
            joinedload(Prescription.patient),
            joinedload(Prescription.doctor),
            joinedload(Prescription.medicines),
        ).filter(
            Prescription.appointment_id == appointment_id,
            Prescription.is_deleted == False,
        ).first()

    def get_patient_prescriptions(
        self,
        patient_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Prescription]:
        """Get prescriptions for a patient."""
        return self.db.query(Prescription).options(
            joinedload(Prescription.doctor),
            joinedload(Prescription.appointment),
            joinedload(Prescription.medicines),
        ).filter(
            Prescription.patient_id == patient_id,
            Prescription.is_deleted == False,
        ).order_by(Prescription.created_at.desc()).offset(skip).limit(limit).all()

    def get_doctor_prescriptions(
        self,
        doctor_id: UUID,
        target_date: Optional[date] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Prescription]:
        """Get prescriptions created by a doctor."""
        query = self.db.query(Prescription).options(
            joinedload(Prescription.patient),
            joinedload(Prescription.appointment),
            joinedload(Prescription.medicines),
        ).filter(
            Prescription.doctor_id == doctor_id,
            Prescription.is_deleted == False,
        )

        if target_date:
            query = query.filter(func.date(Prescription.created_at) == target_date)

        return query.order_by(Prescription.created_at.desc()).offset(skip).limit(limit).all()

    def get_today_prescriptions(self, doctor_id: Optional[UUID] = None) -> List[Prescription]:
        """Get prescriptions created today."""
        today = date.today()
        query = self.db.query(Prescription).options(
            joinedload(Prescription.patient),
            joinedload(Prescription.appointment),
            joinedload(Prescription.medicines),
        ).filter(
            func.date(Prescription.created_at) == today,
            Prescription.is_deleted == False,
        )

        if doctor_id:
            query = query.filter(Prescription.doctor_id == doctor_id)

        return query.order_by(Prescription.created_at.desc()).all()

    def appointment_has_prescription(self, appointment_id: UUID) -> bool:
        """Check if appointment already has a prescription."""
        return self.db.query(Prescription.id).filter(
            Prescription.appointment_id == appointment_id,
            Prescription.is_deleted == False,
        ).first() is not None

    def mark_sent(self, prescription_id: UUID, method: str) -> Optional[Prescription]:
        """Mark prescription as sent to patient."""
        prescription = self.get_by_id(prescription_id)
        if not prescription:
            return None

        prescription.sent_to_patient = True
        prescription.sent_via = method
        self.db.commit()
        self.db.refresh(prescription)
        return prescription


class PrescriptionMedicineRepository(BaseRepository[PrescriptionMedicine]):
    """Repository for PrescriptionMedicine model operations."""

    def __init__(self, db: Session):
        super().__init__(PrescriptionMedicine, db)

    def get_by_prescription(self, prescription_id: UUID) -> List[PrescriptionMedicine]:
        """Get all medicines for a prescription."""
        return self.db.query(PrescriptionMedicine).filter(
            PrescriptionMedicine.prescription_id == prescription_id,
            PrescriptionMedicine.is_deleted == False,
        ).order_by(PrescriptionMedicine.sequence_order).all()

    def delete_by_prescription(self, prescription_id: UUID) -> int:
        """Soft delete all medicines for a prescription."""
        count = self.db.query(PrescriptionMedicine).filter(
            PrescriptionMedicine.prescription_id == prescription_id,
            PrescriptionMedicine.is_deleted == False,
        ).update({
            "is_deleted": True,
        })
        self.db.commit()
        return count

    def bulk_create(self, prescription_id: UUID, medicines: List[dict]) -> List[PrescriptionMedicine]:
        """Create multiple medicines for a prescription."""
        created = []
        for idx, med_data in enumerate(medicines):
            medicine = PrescriptionMedicine(
                prescription_id=prescription_id,
                medicine_name=med_data["medicine_name"],
                dosage=med_data.get("dosage"),
                frequency=med_data.get("frequency"),
                duration=med_data.get("duration"),
                instructions=med_data.get("instructions"),
                sequence_order=idx,
            )
            self.db.add(medicine)
            created.append(medicine)

        self.db.commit()
        for m in created:
            self.db.refresh(m)
        return created
