"""
Doctor Controller - Doctor dashboard and workflow endpoints

Derived from frontend DoctorDashboard.tsx:
- Patient queue management
- Current patient display
- Prescription workflow
- Patient history access
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_doctor
from app.models.doctor import Doctor
from app.services.appointment_service import AppointmentService
from app.services.prescription_service import PrescriptionService
from app.services.patient_service import PatientService
from app.services.vitals_service import VitalsService
from app.schemas.appointment import AppointmentResponse, QueueStatsResponse

router = APIRouter(prefix="/doctor", tags=["Doctor Dashboard"])


@router.get("/queue", response_model=list[AppointmentResponse])
def get_my_queue(
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """
    Get current doctor's patient queue for today.

    Maps to: DoctorDashboard.tsx - PatientQueue component
    """
    service = AppointmentService(db)
    appointments = service.get_waiting_queue(current_doctor.id)
    return [service.build_response(a) for a in appointments]


@router.get("/queue/stats", response_model=QueueStatsResponse)
def get_my_queue_stats(
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """
    Get queue statistics for current doctor.

    Maps to: DoctorDashboard.tsx - Stats display
    """
    service = AppointmentService(db)
    return service.get_queue_stats(current_doctor.id)


@router.get("/current-patient", response_model=Optional[AppointmentResponse])
def get_current_patient(
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """
    Get the current patient being consulted.

    Maps to: DoctorDashboard.tsx - Current patient card
    """
    service = AppointmentService(db)
    appointment = service.get_current_patient(current_doctor.id)
    if not appointment:
        return None
    return service.build_response(appointment)


@router.post("/call-next", response_model=AppointmentResponse)
def call_next_patient(
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """
    Call the next patient in queue.

    Maps to: DoctorDashboard.tsx - Call Next button
    """
    service = AppointmentService(db)
    appointment = service.call_next_patient(current_doctor.id)
    return service.build_response(appointment)


@router.get("/patient/{patient_id}/history")
def get_patient_history(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """
    Get complete patient history for consultation.

    Maps to: DoctorDashboard.tsx - Patient History panel

    Returns patient details, vitals history, and prescription history.
    """
    patient_service = PatientService(db)
    vitals_service = VitalsService(db)
    prescription_service = PrescriptionService(db)
    appointment_service = AppointmentService(db)

    patient = patient_service.get_patient(patient_id)

    # Get recent vitals
    vitals = vitals_service.get_patient_vitals(patient_id, limit=10)

    # Get prescription history
    prescriptions = prescription_service.get_patient_prescriptions(patient_id, limit=10)

    # Get appointment history
    appointments = appointment_service.get_patient_appointments(patient_id, limit=10)

    return {
        "patient": patient_service.build_response(patient),
        "vitals": [vitals_service.build_response(v) for v in vitals],
        "prescriptions": [prescription_service.build_response(p) for p in prescriptions],
        "appointments": [appointment_service.build_response(a) for a in appointments],
    }


@router.get("/today/appointments", response_model=list[AppointmentResponse])
def get_my_today_appointments(
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """
    Get all of today's appointments for current doctor.

    Maps to: DoctorDashboard.tsx - Full appointment list
    """
    service = AppointmentService(db)
    appointments = service.get_today_appointments(current_doctor.id)
    return [service.build_response(a) for a in appointments]


@router.get("/today/prescriptions")
def get_my_today_prescriptions(
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """
    Get prescriptions created today by current doctor.

    Maps to: DoctorDashboard.tsx - Today's prescriptions summary
    """
    service = PrescriptionService(db)
    prescriptions = service.get_today_prescriptions(current_doctor.id)
    return [service.build_response(p) for p in prescriptions]


@router.get("/today/summary")
def get_today_summary(
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """
    Get summary of today's work for doctor dashboard.

    Maps to: DoctorDashboard.tsx - Dashboard stats
    """
    appointment_service = AppointmentService(db)
    prescription_service = PrescriptionService(db)

    queue_stats = appointment_service.get_queue_stats(current_doctor.id)
    today_prescriptions = prescription_service.get_today_prescriptions(current_doctor.id)

    return {
        "queue": queue_stats,
        "prescriptions_count": len(today_prescriptions),
        "patients_seen": queue_stats.completed,
        "patients_waiting": queue_stats.waiting,
        "current_in_progress": queue_stats.in_progress,
    }
