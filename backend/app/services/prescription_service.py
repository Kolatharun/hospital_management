"""
Prescription Service - Doctor prescription operations
"""

import os
import logging
from datetime import date
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.repositories.prescription_repository import PrescriptionRepository, PrescriptionMedicineRepository
from app.repositories.appointment_repository import AppointmentRepository
from app.repositories.queue_repository import LabQueueRepository, PharmacyQueueRepository
from app.repositories.vitals_repository import VitalsRepository
from app.models.prescription import Prescription
from app.models.appointment import AppointmentStatus
from app.models.queue import QueueStatus
from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionUpdate,
    PrescriptionResponse,
    MedicineResponse,
)

logger = logging.getLogger(__name__)


class PrescriptionService:
    """Service for prescription operations."""

    def __init__(self, db: Session):
        self.db = db
        self.prescription_repo = PrescriptionRepository(db)
        self.medicine_repo = PrescriptionMedicineRepository(db)
        self.appointment_repo = AppointmentRepository(db)
        self.lab_queue_repo = LabQueueRepository(db)
        self.pharmacy_queue_repo = PharmacyQueueRepository(db)
        self.vitals_repo = VitalsRepository(db)

    def create_prescription(self, data: PrescriptionCreate, doctor_id: UUID) -> Prescription:
        """Create a new prescription for an appointment."""
        # Verify appointment exists and is in progress
        appointment = self.appointment_repo.get_with_details(data.appointment_id)
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found",
            )

        if appointment.status != AppointmentStatus.IN_PROGRESS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Appointment must be in progress to create prescription",
            )

        # Check if prescription already exists
        if self.prescription_repo.appointment_has_prescription(data.appointment_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Prescription already exists for this appointment",
            )

        # Create prescription
        prescription_data = {
            "appointment_id": data.appointment_id,
            "patient_id": appointment.patient_id,
            "doctor_id": doctor_id,
            "diagnosis": data.diagnosis,
            "complaint": data.complaint,
            "history": data.history,
            "lab_tests": data.lab_tests,
            "advice": data.advice,
            "notes": data.notes,
            "follow_up_days": data.follow_up_days,
        }
        prescription = self.prescription_repo.create(prescription_data)

        # Add medicines
        if data.medicines:
            medicines_data = [m.model_dump() for m in data.medicines]
            self.medicine_repo.bulk_create(prescription.id, medicines_data)

        # Reload with relationships
        return self.prescription_repo.get_with_details(prescription.id)

    def get_prescription(self, prescription_id: UUID) -> Prescription:
        """Get prescription by ID."""
        prescription = self.prescription_repo.get_with_details(prescription_id)
        if not prescription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found",
            )
        return prescription

    def get_by_appointment(self, appointment_id: UUID) -> Prescription:
        """Get prescription for an appointment."""
        prescription = self.prescription_repo.get_by_appointment(appointment_id)
        if not prescription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found for this appointment",
            )
        return prescription

    def get_patient_prescriptions(
        self,
        patient_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Prescription]:
        """Get prescription history for a patient."""
        return self.prescription_repo.get_patient_prescriptions(patient_id, skip, limit)

    def get_doctor_prescriptions(
        self,
        doctor_id: UUID,
        target_date: Optional[date] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Prescription]:
        """Get prescriptions created by a doctor."""
        return self.prescription_repo.get_doctor_prescriptions(doctor_id, target_date, skip, limit)

    def get_today_prescriptions(self, doctor_id: Optional[UUID] = None) -> List[Prescription]:
        """Get prescriptions created today."""
        return self.prescription_repo.get_today_prescriptions(doctor_id)

    def update_prescription(
        self,
        prescription_id: UUID,
        data: PrescriptionUpdate,
        doctor_id: UUID,
    ) -> Prescription:
        """Update a prescription."""
        prescription = self.get_prescription(prescription_id)

        # Verify doctor owns this prescription
        if prescription.doctor_id != doctor_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot update prescription created by another doctor",
            )

        # Update basic fields
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None and k != "medicines"}
        if update_dict:
            self.prescription_repo.update(prescription_id, update_dict)

        # Update medicines if provided
        if data.medicines is not None:
            self.medicine_repo.delete_by_prescription(prescription_id)
            if data.medicines:
                medicines_data = [m.model_dump() for m in data.medicines]
                self.medicine_repo.bulk_create(prescription_id, medicines_data)

        return self.prescription_repo.get_with_details(prescription_id)

    def send_to_lab(self, prescription_id: UUID, lab_tests: List[str]) -> dict:
        """Send patient to lab queue."""
        prescription = self.get_prescription(prescription_id)
        appointment = prescription.appointment
        patient = prescription.patient

        # Check if already in lab queue
        existing = self.lab_queue_repo.get_by_appointment(appointment.id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Patient already in lab queue",
            )

        # Add to lab queue
        queue_data = {
            "appointment_id": appointment.id,
            "patient_id": patient.id,
            "patient_name": f"{patient.first_name} {patient.last_name}",
            "mr_number": patient.mr_number,
            "op_number": appointment.op_number,
            "token_number": appointment.token_number,
            "lab_tests": lab_tests,
            "status": QueueStatus.PENDING,
        }
        self.lab_queue_repo.create(queue_data)

        return {"message": "Patient added to lab queue", "tests": lab_tests}

    def send_to_pharmacy(self, prescription_id: UUID, medicines: List[str]) -> dict:
        """Send patient to pharmacy queue."""
        prescription = self.get_prescription(prescription_id)
        appointment = prescription.appointment
        patient = prescription.patient

        # Check if already in pharmacy queue
        existing = self.pharmacy_queue_repo.get_by_appointment(appointment.id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Patient already in pharmacy queue",
            )

        # Add to pharmacy queue
        queue_data = {
            "appointment_id": appointment.id,
            "patient_id": patient.id,
            "patient_name": f"{patient.first_name} {patient.last_name}",
            "mr_number": patient.mr_number,
            "op_number": appointment.op_number,
            "token_number": appointment.token_number,
            "prescription_id": prescription.id,
            "medicines": medicines,
            "status": QueueStatus.PENDING,
        }
        self.pharmacy_queue_repo.create(queue_data)

        return {"message": "Patient added to pharmacy queue", "medicines": medicines}

    def generate_pdf(self, prescription_id: UUID) -> str:
        """Generate prescription PDF and store in uploads/prescriptions/ folder.

        Returns the stored PDF file path.
        """
        from app.utils.prescription_generator import generate_prescription_pdf

        prescription = self.get_prescription(prescription_id)

        # Fetch vitals for the appointment
        vitals = None
        if prescription.appointment_id:
            vitals = self.vitals_repo.get_by_appointment(prescription.appointment_id)

        return generate_prescription_pdf(prescription, vitals)

    def get_pdf_path(self, prescription_id: UUID) -> str:
        """Get path to an existing prescription PDF, or generate if missing."""
        from app.utils.prescription_generator import PRESCRIPTIONS_DIR

        prescription = self.get_prescription(prescription_id)

        # Check if PDF already exists
        op_number = prescription.appointment.op_number if prescription.appointment else None
        if op_number:
            filename = f"{op_number}.pdf"
        else:
            filename = f"{prescription.id}.pdf"

        pdf_path = str(PRESCRIPTIONS_DIR / filename)

        if os.path.exists(pdf_path):
            return pdf_path

        # Generate if not exists
        return self.generate_pdf(prescription_id)

    def send_to_patient(self, prescription_id: UUID, method: str) -> Prescription:
        """Send prescription to patient via WhatsApp or email.

        Generates PDF, sends via the specified method, and marks as sent.
        """
        from app.utils.notification_service import (
            send_email_with_prescription,
            send_whatsapp_with_prescription,
        )

        prescription = self.get_prescription(prescription_id)

        if method not in ["whatsapp", "email"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Method must be 'whatsapp' or 'email'",
            )

        patient = prescription.patient
        op_number = prescription.appointment.op_number if prescription.appointment else str(prescription.id)[:8]
        patient_name = f"{patient.first_name} {patient.last_name}" if patient else "Patient"

        # Generate or get existing PDF
        pdf_path = self.get_pdf_path(prescription_id)

        if method == "email":
            if not patient or not patient.email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Patient does not have an email address",
                )
            send_email_with_prescription(
                to_email=patient.email,
                patient_name=patient_name,
                op_number=op_number,
                pdf_path=pdf_path,
            )
        elif method == "whatsapp":
            if not patient or not patient.phone:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Patient does not have a phone number",
                )
            send_whatsapp_with_prescription(
                phone_number=patient.phone,
                patient_name=patient_name,
                op_number=op_number,
                pdf_path=pdf_path,
            )

        # Mark as sent in database
        self.prescription_repo.mark_sent(prescription_id, method)

        return self.prescription_repo.get_with_details(prescription_id)

    def build_response(self, prescription: Prescription) -> PrescriptionResponse:
        """Build prescription response with all related data."""
        patient = prescription.patient
        appointment = prescription.appointment
        doctor = prescription.doctor

        # Calculate age and gender string
        age_gender = None
        if patient:
            age_str = ""
            if patient.date_of_birth:
                from datetime import date
                today = date.today()
                age = today.year - patient.date_of_birth.year
                if today.month < patient.date_of_birth.month or (
                    today.month == patient.date_of_birth.month and today.day < patient.date_of_birth.day
                ):
                    age -= 1
                age_str = f"{age}Y"
            gender = patient.gender.value if patient.gender else ""
            age_gender = f"{age_str}/{gender}" if age_str or gender else None

        medicines = []
        if prescription.medicines:
            medicines = [
                MedicineResponse(
                    id=m.id,
                    medicine_name=m.medicine_name,
                    dosage=m.dosage,
                    frequency=m.frequency,
                    duration=m.duration,
                    instructions=m.instructions,
                    sequence_order=m.sequence_order,
                )
                for m in sorted(prescription.medicines, key=lambda x: x.sequence_order)
                if not m.is_deleted
            ]

        return PrescriptionResponse(
            id=prescription.id,
            patient_id=prescription.patient_id,
            appointment_id=prescription.appointment_id,
            doctor_id=prescription.doctor_id,
            diagnosis=prescription.diagnosis,
            complaint=prescription.complaint,
            history=prescription.history,
            lab_tests=prescription.lab_tests,
            advice=prescription.advice,
            notes=prescription.notes,
            follow_up_days=prescription.follow_up_days,
            sent_to_patient=prescription.sent_to_patient,
            sent_via=prescription.sent_via,
            created_at=prescription.created_at.isoformat() if prescription.created_at else None,
            updated_at=prescription.updated_at.isoformat() if prescription.updated_at else None,
            medicines=medicines,
            patient_name=f"{patient.first_name} {patient.last_name}" if patient else None,
            patient_mr_number=patient.mr_number if patient else None,
            patient_age_gender=age_gender,
            doctor_name=doctor.name if doctor else None,
            op_number=appointment.op_number if appointment else None,
        )
