"""
Vitals Service - Patient vitals business logic
"""

from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.repositories.vitals_repository import VitalsRepository
from app.repositories.appointment_repository import AppointmentRepository
from app.models.vitals import PatientVitals
from app.models.user import User
from app.schemas.vitals import VitalsCreate, VitalsUpdate, VitalsResponse, VitalsWithFallbackResponse


class VitalsService:
    """Service for vitals operations."""

    def __init__(self, db: Session):
        self.db = db
        self.vitals_repo = VitalsRepository(db)
        self.appointment_repo = AppointmentRepository(db)

    def record_vitals(self, data: VitalsCreate, recorded_by: User = None) -> PatientVitals:
        """Record patient vitals for an appointment."""
        # Verify appointment exists
        appointment = self.appointment_repo.get_with_details(data.appointment_id)
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found",
            )

        # Check if vitals already recorded
        if self.vitals_repo.appointment_has_vitals(data.appointment_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vitals already recorded for this appointment",
            )

        vitals_data = {
            "appointment_id": data.appointment_id,
            "patient_id": appointment.patient_id,
            "recorded_by": recorded_by.id,
            "spo2": data.spo2,
            "pulse": data.pulse,
            "blood_pressure": data.blood_pressure,
            "cvs": data.cvs,
            "rs": data.rs,
            "jvp": data.jvp,
            "weight": data.weight,
            "hlp": data.hlp,
            "htn": data.htn,
            "dm": data.dm,
            "smoking": data.smoking,
            "family_ho_cad": data.family_ho_cad,
            "heart_disease": data.heart_disease,
            "ptca_cabg": data.ptca_cabg,
            "current_drugs": data.current_drugs,
        }

        return self.vitals_repo.create(vitals_data)

    def get_vitals(self, vitals_id: UUID) -> PatientVitals:
        """Get vitals by ID."""
        vitals = self.vitals_repo.get_by_id(vitals_id)
        if not vitals:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vitals not found",
            )
        return vitals

    def get_appointment_vitals(self, appointment_id: UUID) -> Optional[PatientVitals]:
        """Get vitals for an appointment."""
        return self.vitals_repo.get_by_appointment(appointment_id)

    def get_by_appointment(self, appointment_id: UUID) -> PatientVitals:
        """Get vitals for an appointment (with error handling)."""
        vitals = self.vitals_repo.get_by_appointment(appointment_id)
        if not vitals:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vitals not found for this appointment",
            )
        return vitals

    def get_patient_vitals(
        self,
        patient_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> List[PatientVitals]:
        """Get vitals history for a patient."""
        return self.vitals_repo.get_patient_vitals(patient_id, skip, limit)

    def update_vitals(self, vitals_id: UUID, data: VitalsUpdate) -> PatientVitals:
        """Update vitals record."""
        vitals = self.get_vitals(vitals_id)

        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        if not update_dict:
            return vitals

        return self.vitals_repo.update(vitals_id, update_dict)

    def get_today_vitals(self) -> List[PatientVitals]:
        """Get all vitals recorded today."""
        return self.vitals_repo.get_today_vitals()

    def get_patient_vitals_history(
        self,
        patient_id: UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> dict:
        """Get vitals history for a patient."""
        skip = (page - 1) * page_size
        vitals = self.vitals_repo.get_patient_vitals(patient_id, skip, page_size)
        return {
            "items": [self.build_response(v) for v in vitals],
            "total": len(vitals),
        }

    def get_vitals_with_fallback(self, appointment_id: UUID) -> VitalsWithFallbackResponse:
        """Get vitals for an appointment with fallback to previous visits.

        Logic:
        1. Check if current OP has vitals -> return them (is_old_vitals=False)
        2. If no vitals for current OP, check for previous visits' vitals
        3. If previous vitals found -> return most recent (is_old_vitals=True)
        4. If no vitals at all -> return empty response (has_vitals=False)
        """
        # Step 1: Try to get vitals for current appointment
        current_vitals = self.vitals_repo.get_by_appointment(appointment_id)

        if current_vitals:
            # Current OP has vitals - return normally
            return VitalsWithFallbackResponse(
                vitals=self.build_response(current_vitals),
                is_old_vitals=False,
                source_op_number=None,
                visit_date=None,
                has_vitals=True,
            )

        # Step 2: No vitals for current OP - get appointment to find patient_id
        appointment = self.appointment_repo.get_with_details(appointment_id)
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found",
            )

        # Step 3: Try to get most recent vitals from previous visits
        previous_vitals = self.vitals_repo.get_most_recent_patient_vitals(
            patient_id=appointment.patient_id,
            exclude_appointment_id=appointment_id,
        )

        if previous_vitals:
            # Found previous vitals - return with fallback info
            prev_appointment = previous_vitals.appointment
            return VitalsWithFallbackResponse(
                vitals=self.build_response(previous_vitals),
                is_old_vitals=True,
                source_op_number=prev_appointment.op_number if prev_appointment else None,
                visit_date=prev_appointment.appointment_date.isoformat() if prev_appointment and prev_appointment.appointment_date else None,
                has_vitals=True,
            )

        # Step 4: No vitals found at all for this patient
        return VitalsWithFallbackResponse(
            vitals=None,
            is_old_vitals=False,
            source_op_number=None,
            visit_date=None,
            has_vitals=False,
        )

    def build_response(self, vitals: PatientVitals) -> VitalsResponse:
        """Build vitals response."""
        patient = vitals.patient
        appointment = vitals.appointment
        recorder = vitals.recorder

        return VitalsResponse(
            id=vitals.id,
            appointment_id=vitals.appointment_id,
            patient_id=vitals.patient_id,
            recorded_by=vitals.recorded_by,
            spo2=vitals.spo2,
            pulse=vitals.pulse,
            blood_pressure=vitals.blood_pressure,
            cvs=vitals.cvs,
            rs=vitals.rs,
            jvp=vitals.jvp,
            weight=vitals.weight,
            hlp=vitals.hlp,
            htn=vitals.htn,
            dm=vitals.dm,
            smoking=vitals.smoking,
            family_ho_cad=vitals.family_ho_cad,
            heart_disease=vitals.heart_disease,
            ptca_cabg=vitals.ptca_cabg,
            current_drugs=vitals.current_drugs,
            created_at=vitals.created_at.isoformat() if vitals.created_at else None,
            updated_at=vitals.updated_at.isoformat() if vitals.updated_at else None,
            spo2_status=vitals.spo2_status,
            systolic=vitals.systolic,
            diastolic=vitals.diastolic,
            patient_name=patient.full_name if patient else None,
            patient_mr_number=patient.mr_number if patient else None,
            op_number=appointment.op_number if appointment else None,
            recorded_by_name=recorder.display_name if recorder else None,
        )
