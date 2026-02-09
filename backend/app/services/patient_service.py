"""
Patient Service - Patient business logic
"""

from datetime import date
from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.repositories.patient_repository import PatientRepository
from app.repositories.appointment_repository import AppointmentRepository
from app.models.patient import Patient, Gender, PatientType
from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientWithAppointmentCreate,
)


class PatientService:
    """Service for patient operations."""

    def __init__(self, db: Session):
        self.db = db
        self.patient_repo = PatientRepository(db)
        self.appointment_repo = AppointmentRepository(db)

    def register_patient(self, data: PatientCreate) -> Patient:
        """
        Register a new patient.

        Generates MR number automatically.
        """
        # Generate MR number
        mr_number = self.patient_repo.generate_mr_number()

        # Create patient dict
        patient_data = {
            "mr_number": mr_number,
            "first_name": data.first_name,
            "last_name": data.last_name,
            "date_of_birth": data.date_of_birth,
            "gender": Gender(data.gender),
            "marital_status": data.marital_status,
            "patient_type": PatientType(data.patient_type) if data.patient_type else PatientType.NEW,
            "phone": data.phone,
            "email": data.email,
            "emergency_contact": data.emergency_contact,
            "address": data.address,
            "city": data.city,
            "state": data.state,
            "pin_code": data.pin_code,
            "blood_group": data.blood_group,
        }

        patient = self.patient_repo.create(patient_data)
        return patient

    def register_with_appointment(
        self,
        data: PatientWithAppointmentCreate,
    ) -> dict:
        """Register patient and create immediate appointment."""
        # Register patient
        patient = self.register_patient(data)

        # Create appointment
        appointment_date = data.appointment_date or date.today()
        op_number = self.appointment_repo.generate_op_number(appointment_date)
        token_number = self.appointment_repo.get_next_token_number(appointment_date)

        appointment_data = {
            "op_number": op_number,
            "patient_id": patient.id,
            "doctor_id": data.doctor_id,
            "appointment_date": appointment_date,
            "token_number": token_number,
        }

        appointment = self.appointment_repo.create(appointment_data)

        return {
            "patient": patient,
            "appointment": appointment,
        }

    def get_patient(self, patient_id: UUID) -> Patient:
        """Get patient by ID."""
        patient = self.patient_repo.get_by_id(patient_id)
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found",
            )
        return patient

    def get_by_mr_number(self, mr_number: str) -> Patient:
        """Get patient by MR number."""
        patient = self.patient_repo.get_by_mr_number(mr_number)
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found",
            )
        return patient

    def update_patient(self, patient_id: UUID, data: PatientUpdate) -> Patient:
        """Update patient information."""
        patient = self.get_patient(patient_id)

        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}

        if "gender" in update_dict:
            update_dict["gender"] = Gender(update_dict["gender"])
        if "patient_type" in update_dict:
            update_dict["patient_type"] = PatientType(update_dict["patient_type"])

        if not update_dict:
            return patient

        updated = self.patient_repo.update(patient_id, update_dict)
        return updated

    def search_patients(
        self,
        query: str,
        search_type: str = "all",
        skip: int = 0,
        limit: int = 20,
    ) -> tuple:
        """Search patients. Returns (patients, total_count)."""
        patients = self.patient_repo.search(query, search_type, skip, limit)
        total = self.patient_repo.count_search(query, search_type)
        return patients, total

    def get_recent_registrations(
        self,
        days: int = 7,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Patient]:
        """Get recently registered patients."""
        return self.patient_repo.get_recent_registrations(days, skip, limit)

    def get_today_registrations(self) -> List[Patient]:
        """Get patients registered today."""
        return self.patient_repo.get_today_registrations()

    def delete_patient(self, patient_id: UUID) -> None:
        """Soft delete a patient."""
        self.get_patient(patient_id)  # Verify exists
        self.patient_repo.soft_delete(patient_id)

    def build_response(self, patient: Patient) -> PatientResponse:
        """Build patient response with computed fields."""
        return PatientResponse(
            id=patient.id,
            mr_number=patient.mr_number,
            first_name=patient.first_name,
            last_name=patient.last_name,
            date_of_birth=patient.date_of_birth,
            gender=patient.gender.value if patient.gender else None,
            marital_status=patient.marital_status.value if patient.marital_status else None,
            patient_type=patient.patient_type.value if patient.patient_type else None,
            phone=patient.phone,
            email=patient.email,
            emergency_contact=patient.emergency_contact,
            address=patient.address,
            city=patient.city,
            state=patient.state,
            pin_code=patient.pin_code,
            blood_group=patient.blood_group,
            created_at=patient.created_at.isoformat() if patient.created_at else None,
            updated_at=patient.updated_at.isoformat() if patient.updated_at else None,
            full_name=patient.full_name,
            age=patient.age,
            age_gender=patient.age_gender,
        )
