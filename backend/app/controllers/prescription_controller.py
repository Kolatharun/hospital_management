"""
Prescription Controller - Doctor prescription management endpoints
"""

import os
from typing import Optional
from uuid import UUID
from datetime import date

from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.core.deps import get_current_user, get_current_user_optional, require_roles, get_current_doctor
from app.models.user import User, UserRole
from app.models.doctor import Doctor
from app.services.prescription_service import PrescriptionService
from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionUpdate,
    PrescriptionResponse,
    SendToLabRequest,
    SendToPharmacyRequest,
    SendPrescriptionRequest,
    SendPrescriptionEmailRequest,
    SendPrescriptionWhatsAppRequest,
)

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])


@router.post("", response_model=PrescriptionResponse)
def create_prescription(
    data: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """Create a new prescription for an appointment (Doctor only)."""
    service = PrescriptionService(db)
    prescription = service.create_prescription(data, current_doctor.id)
    return service.build_response(prescription)


@router.get("/today", response_model=list[PrescriptionResponse])
def get_today_prescriptions(
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """Get prescriptions created today by current doctor."""
    service = PrescriptionService(db)
    prescriptions = service.get_today_prescriptions(current_doctor.id)
    return [service.build_response(p) for p in prescriptions]


@router.get("/my", response_model=list[PrescriptionResponse])
def get_my_prescriptions(
    target_date: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """Get prescriptions created by current doctor."""
    service = PrescriptionService(db)
    prescriptions = service.get_doctor_prescriptions(current_doctor.id, target_date, skip, limit)
    return [service.build_response(p) for p in prescriptions]


@router.get("/appointment/{appointment_id}", response_model=PrescriptionResponse)
def get_appointment_prescription(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get prescription for a specific appointment."""
    service = PrescriptionService(db)
    prescription = service.get_by_appointment(appointment_id)
    return service.build_response(prescription)


@router.get("/patient/{patient_id}", response_model=list[PrescriptionResponse])
def get_patient_prescriptions(
    patient_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get prescription history for a patient."""
    service = PrescriptionService(db)
    prescriptions = service.get_patient_prescriptions(patient_id, skip, limit)
    return [service.build_response(p) for p in prescriptions]


@router.get("/{prescription_id}", response_model=PrescriptionResponse)
def get_prescription(
    prescription_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get prescription by ID."""
    service = PrescriptionService(db)
    prescription = service.get_prescription(prescription_id)
    return service.build_response(prescription)


@router.put("/{prescription_id}", response_model=PrescriptionResponse)
def update_prescription(
    prescription_id: UUID,
    data: PrescriptionUpdate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """Update a prescription (Doctor only, own prescriptions)."""
    service = PrescriptionService(db)
    prescription = service.update_prescription(prescription_id, data, current_doctor.id)
    return service.build_response(prescription)


@router.post("/{prescription_id}/generate-pdf")
def generate_prescription_pdf(
    prescription_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate prescription PDF and store in backend folder."""
    service = PrescriptionService(db)
    try:
        pdf_path = service.generate_pdf(prescription_id)
        return {"message": "PDF generated successfully", "pdf_path": pdf_path}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}",
        )


@router.get("/{prescription_id}/download-pdf")
def download_prescription_pdf(
    prescription_id: UUID,
    token: Optional[str] = Query(None),
    download: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Download prescription PDF. Generates if not already stored.
    
    Accepts JWT token via query parameter to support <img> and <iframe> tags.
    """
    # If no current_user (from header), check token in query param
    if not current_user:
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
            )
        
        payload = decode_token(token)
        if not payload or payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
        
        user_id = payload.get("sub")
        current_user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

    service = PrescriptionService(db)
    try:
        pdf_path = service.get_pdf_path(prescription_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}",
        )

    if not os.path.exists(pdf_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF file not found",
        )

    disposition = "attachment" if download else "inline"
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        headers={"Content-Disposition": disposition}
    )


@router.post("/{prescription_id}/send-email")
def send_prescription_email(
    prescription_id: UUID,
    data: SendPrescriptionEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate prescription PDF and send via email."""
    from app.utils.notification_service import send_email_with_prescription

    service = PrescriptionService(db)
    prescription = service.get_prescription(prescription_id)
    patient = prescription.patient

    op_number = prescription.appointment.op_number if prescription.appointment else str(prescription.id)[:8]
    patient_name = f"{patient.first_name} {patient.last_name}" if patient else "Patient"

    try:
        pdf_path = service.get_pdf_path(prescription_id)
        send_email_with_prescription(
            to_email=data.email,
            patient_name=patient_name,
            op_number=op_number,
            pdf_path=pdf_path,
        )
        # Mark as sent
        service.prescription_repo.mark_sent(prescription_id, "email")
        return {"message": f"Prescription sent successfully to {data.email}"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}",
        )


@router.post("/{prescription_id}/send-whatsapp")
def send_prescription_whatsapp(
    prescription_id: UUID,
    data: SendPrescriptionWhatsAppRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate prescription PDF and send via WhatsApp."""
    from app.utils.notification_service import send_whatsapp_with_prescription

    service = PrescriptionService(db)
    prescription = service.get_prescription(prescription_id)
    patient = prescription.patient

    op_number = prescription.appointment.op_number if prescription.appointment else str(prescription.id)[:8]
    patient_name = f"{patient.first_name} {patient.last_name}" if patient else "Patient"

    try:
        pdf_path = service.get_pdf_path(prescription_id)
        send_whatsapp_with_prescription(
            phone_number=data.phone,
            patient_name=patient_name,
            op_number=op_number,
            pdf_path=pdf_path,
        )
        # Mark as sent
        service.prescription_repo.mark_sent(prescription_id, "whatsapp")
        return {"message": f"Prescription sent successfully via WhatsApp to {data.phone}"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send WhatsApp: {str(e)}",
        )


@router.post("/{prescription_id}/send-to-lab")
def send_to_lab(
    prescription_id: UUID,
    data: SendToLabRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send patient to lab queue with tests."""
    service = PrescriptionService(db)
    return service.send_to_lab(prescription_id, data.lab_tests)


@router.post("/{prescription_id}/send-to-pharmacy")
def send_to_pharmacy(
    prescription_id: UUID,
    data: SendToPharmacyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send patient to pharmacy queue with medicines."""
    service = PrescriptionService(db)
    return service.send_to_pharmacy(prescription_id, data.medicines)


@router.post("/{prescription_id}/send-to-lab-email")
def send_to_lab_email(
    prescription_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send prescription PDF to lab via email with lab-specific body."""
    from app.core.config import settings
    from app.utils.notification_service import send_prescription_to_lab_email

    if not settings.LAB_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="LAB_EMAIL is not configured in environment",
        )

    service = PrescriptionService(db)
    prescription = service.get_prescription(prescription_id)
    patient = prescription.patient
    op_number = prescription.appointment.op_number if prescription.appointment else str(prescription.id)[:8]
    patient_name = f"{patient.first_name} {patient.last_name}" if patient else "Patient"

    # Extract lab tests from the prescription
    lab_tests = []
    if prescription.lab_tests:
        lab_tests = [t.strip() for t in prescription.lab_tests.split(",") if t.strip()]

    try:
        pdf_path = service.get_pdf_path(prescription_id)
        send_prescription_to_lab_email(
            to_email=settings.LAB_EMAIL,
            patient_name=patient_name,
            op_number=op_number,
            pdf_path=pdf_path,
            lab_tests=lab_tests,
        )
        return {"message": f"Prescription sent to lab at {settings.LAB_EMAIL}"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email to lab: {str(e)}",
        )


@router.post("/{prescription_id}/send-to-lab-whatsapp")
def send_to_lab_whatsapp(
    prescription_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send prescription PDF to lab via WhatsApp with lab-specific caption."""
    from app.core.config import settings
    from app.utils.notification_service import send_prescription_to_lab_whatsapp

    if not settings.LAB_PHONE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="LAB_PHONE is not configured in environment",
        )

    service = PrescriptionService(db)
    prescription = service.get_prescription(prescription_id)
    patient = prescription.patient
    op_number = prescription.appointment.op_number if prescription.appointment else str(prescription.id)[:8]
    patient_name = f"{patient.first_name} {patient.last_name}" if patient else "Patient"

    lab_tests = []
    if prescription.lab_tests:
        lab_tests = [t.strip() for t in prescription.lab_tests.split(",") if t.strip()]

    try:
        pdf_path = service.get_pdf_path(prescription_id)
        send_prescription_to_lab_whatsapp(
            phone_number=settings.LAB_PHONE,
            patient_name=patient_name,
            op_number=op_number,
            pdf_path=pdf_path,
            lab_tests=lab_tests,
        )
        return {"message": f"Prescription sent to lab via WhatsApp"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send WhatsApp to lab: {str(e)}",
        )


@router.post("/{prescription_id}/send-to-pharmacy-email")
def send_to_pharmacy_email(
    prescription_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send prescription PDF to pharmacy via email with pharmacy-specific body."""
    from app.core.config import settings
    from app.utils.notification_service import send_prescription_to_pharmacy_email

    if not settings.PHARMACY_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PHARMACY_EMAIL is not configured in environment",
        )

    service = PrescriptionService(db)
    prescription = service.get_prescription(prescription_id)
    patient = prescription.patient
    op_number = prescription.appointment.op_number if prescription.appointment else str(prescription.id)[:8]
    patient_name = f"{patient.first_name} {patient.last_name}" if patient else "Patient"

    # Extract medicine names from the prescription
    medicines = []
    if prescription.medicines:
        medicines = [m.medicine_name for m in prescription.medicines if not m.is_deleted]

    try:
        pdf_path = service.get_pdf_path(prescription_id)
        send_prescription_to_pharmacy_email(
            to_email=settings.PHARMACY_EMAIL,
            patient_name=patient_name,
            op_number=op_number,
            pdf_path=pdf_path,
            medicines=medicines,
        )
        return {"message": f"Prescription sent to pharmacy at {settings.PHARMACY_EMAIL}"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email to pharmacy: {str(e)}",
        )


@router.post("/{prescription_id}/send-to-pharmacy-whatsapp")
def send_to_pharmacy_whatsapp(
    prescription_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send prescription PDF to pharmacy via WhatsApp with pharmacy-specific caption."""
    from app.core.config import settings
    from app.utils.notification_service import send_prescription_to_pharmacy_whatsapp

    if not settings.PHARMACY_PHONE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PHARMACY_PHONE is not configured in environment",
        )

    service = PrescriptionService(db)
    prescription = service.get_prescription(prescription_id)
    patient = prescription.patient
    op_number = prescription.appointment.op_number if prescription.appointment else str(prescription.id)[:8]
    patient_name = f"{patient.first_name} {patient.last_name}" if patient else "Patient"

    medicines = []
    if prescription.medicines:
        medicines = [m.medicine_name for m in prescription.medicines if not m.is_deleted]

    try:
        pdf_path = service.get_pdf_path(prescription_id)
        send_prescription_to_pharmacy_whatsapp(
            phone_number=settings.PHARMACY_PHONE,
            patient_name=patient_name,
            op_number=op_number,
            pdf_path=pdf_path,
            medicines=medicines,
        )
        return {"message": f"Prescription sent to pharmacy via WhatsApp"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send WhatsApp to pharmacy: {str(e)}",
        )


@router.post("/{prescription_id}/send-to-patient", response_model=PrescriptionResponse)
def send_to_patient(
    prescription_id: UUID,
    data: SendPrescriptionRequest,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """Send prescription to patient via WhatsApp or email."""
    service = PrescriptionService(db)
    prescription = service.send_to_patient(prescription_id, data.method)
    return service.build_response(prescription)
