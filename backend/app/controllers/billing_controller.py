"""
Billing Controller - Bill management and payment endpoints
"""

import os
from typing import Optional
from uuid import UUID
from datetime import date

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Body, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.services.billing_service import BillingService
from app.schemas.billing import (
    BillCreate,
    BillUpdate,
    BillResponse,
    PaymentRecord,
    DaySummaryResponse,
    DaySummarySendEmailRequest,
    DaySummarySendWhatsAppRequest,
)

router = APIRouter(prefix="/billing", tags=["Billing"])


@router.post("", response_model=BillResponse)
def create_bill(
    data: BillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Create a new bill for an appointment."""
    service = BillingService(db)
    bill = service.create_bill(data, current_user)
    return service.build_response(bill)


@router.get("/today", response_model=list[BillResponse])
def get_today_bills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all bills for today."""
    service = BillingService(db)
    bills = service.get_today_bills()
    return [service.build_response(b) for b in bills]


@router.get("/summary", response_model=DaySummaryResponse)
def get_day_summary(
    target_date: Optional[date] = Query(None, description="Date for summary, defaults to today"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Get billing summary for a day."""
    service = BillingService(db)
    return service.get_day_summary(target_date)


@router.get("/pending", response_model=list[BillResponse])
def get_pending_bills(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Get all pending (unpaid) bills for today."""
    service = BillingService(db)
    bills = service.get_pending_bills()
    return [service.build_response(b) for b in bills]


@router.get("/appointment/{appointment_id}", response_model=BillResponse)
def get_appointment_bill(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get bill for a specific appointment."""
    service = BillingService(db)
    bill = service.get_by_appointment(appointment_id)
    return service.build_response(bill)


@router.get("/patient/{patient_id}", response_model=list[BillResponse])
def get_patient_bills(
    patient_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get billing history for a patient."""
    service = BillingService(db)
    bills = service.get_patient_bills(patient_id, skip, limit)
    return [service.build_response(b) for b in bills]


@router.get("/search", response_model=list[BillResponse])
def search_bills(
    query: Optional[str] = Query(None, description="Search text for patient name, MR number, bill number"),
    patient_id: Optional[UUID] = Query(None, description="Filter by patient ID"),
    mr_number: Optional[str] = Query(None, description="Filter by MR number"),
    bill_number: Optional[str] = Query(None, description="Filter by bill number"),
    from_date: Optional[date] = Query(None, description="Filter bills from this date"),
    to_date: Optional[date] = Query(None, description="Filter bills up to this date"),
    payment_status: Optional[str] = Query(None, description="Filter by payment status (pending, partial, paid)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search bills with various filters."""
    service = BillingService(db)
    bills = service.search_bills(
        query=query,
        patient_id=patient_id,
        mr_number=mr_number,
        bill_number=bill_number,
        from_date=from_date,
        to_date=to_date,
        payment_status=payment_status,
        skip=skip,
        limit=limit,
    )
    return [service.build_response(b) for b in bills]


@router.post("/summary/send-email")
def send_day_summary_email(
    data: DaySummarySendEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Generate day payment summary PDF and send via email."""
    from app.utils.receipt_generator import generate_day_summary_pdf
    from app.utils.notification_service import send_email_with_day_summary, cleanup_temp_file

    service = BillingService(db)
    summary = service.get_day_summary(data.target_date)
    bills = service.search_bills(from_date=data.target_date, to_date=data.target_date, limit=100)

    formatted_date = data.target_date.strftime("%d-%m-%Y")
    bills_data = [
        {
            "created_at": b.created_at.isoformat() if b.created_at else None,
            "bill_number": b.bill_number,
            "patient_name": b.patient_name,
            "uhid": b.uhid or "-",
            "payment_method": b.payment_method.value if b.payment_method else None,
            "paid_amount": float(b.paid_amount or 0),
        }
        for b in bills
    ]

    pdf_path = None
    try:
        pdf_path = generate_day_summary_pdf(
            summary_date=formatted_date,
            cash_total=float(summary.cash_amount),
            card_total=float(summary.card_amount),
            upi_total=float(summary.upi_amount),
            grand_total=float(summary.total_paid),
            total_transactions=summary.total_bills,
            bills=bills_data,
        )
        send_email_with_day_summary(
            to_email=data.email,
            summary_date=formatted_date,
            pdf_path=pdf_path,
        )
        return {"message": f"Day summary sent successfully to {data.email}"}
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
    finally:
        if pdf_path:
            cleanup_temp_file(pdf_path)


@router.post("/summary/send-whatsapp")
def send_day_summary_whatsapp(
    data: DaySummarySendWhatsAppRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Generate day payment summary PDF and send via WhatsApp."""
    from app.utils.receipt_generator import generate_day_summary_pdf
    from app.utils.notification_service import send_whatsapp_with_day_summary, cleanup_temp_file

    service = BillingService(db)
    summary = service.get_day_summary(data.target_date)
    bills = service.search_bills(from_date=data.target_date, to_date=data.target_date, limit=100)

    formatted_date = data.target_date.strftime("%d-%m-%Y")
    bills_data = [
        {
            "created_at": b.created_at.isoformat() if b.created_at else None,
            "bill_number": b.bill_number,
            "patient_name": b.patient_name,
            "uhid": b.uhid or "-",
            "payment_method": b.payment_method.value if b.payment_method else None,
            "paid_amount": float(b.paid_amount or 0),
        }
        for b in bills
    ]

    pdf_path = None
    try:
        pdf_path = generate_day_summary_pdf(
            summary_date=formatted_date,
            cash_total=float(summary.cash_amount),
            card_total=float(summary.card_amount),
            upi_total=float(summary.upi_amount),
            grand_total=float(summary.total_paid),
            total_transactions=summary.total_bills,
            bills=bills_data,
        )
        send_whatsapp_with_day_summary(
            phone_number=data.phone,
            summary_date=formatted_date,
            pdf_path=pdf_path,
        )
        return {"message": f"Day summary sent successfully via WhatsApp to {data.phone}"}
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
    finally:
        if pdf_path:
            cleanup_temp_file(pdf_path)


@router.get("/{bill_id}", response_model=BillResponse)
def get_bill(
    bill_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get bill by ID."""
    service = BillingService(db)
    bill = service.get_bill(bill_id)
    return service.build_response(bill)


@router.post("/{bill_id}/payment", response_model=BillResponse)
def record_payment(
    bill_id: UUID,
    data: PaymentRecord,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Record payment for a bill."""
    service = BillingService(db)
    bill = service.record_payment(bill_id, data)
    return service.build_response(bill)


@router.put("/{bill_id}", response_model=BillResponse)
def update_bill(
    bill_id: UUID,
    data: BillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Update an existing bill."""
    service = BillingService(db)
    bill = service.update_bill(bill_id, data)
    return service.build_response(bill)


@router.get("/{bill_id}/receipt-pdf")
def download_receipt_pdf(
    bill_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate and download bill receipt as PDF."""
    from app.utils.receipt_generator import generate_receipt_pdf
    from app.utils.notification_service import cleanup_temp_file

    service = BillingService(db)
    bill = service.get_bill(bill_id)

    try:
        pdf_path = generate_receipt_pdf(bill)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}",
        )

    # Schedule cleanup after response is sent
    background_tasks.add_task(cleanup_temp_file, pdf_path)

    filename = f"Receipt_{bill.bill_number}.pdf"
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{bill_id}/send-email")
def send_receipt_email(
    bill_id: UUID,
    email: str = Body(..., embed=True, description="Recipient email address"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Generate bill receipt PDF and send via email."""
    from app.utils.receipt_generator import generate_receipt_pdf
    from app.utils.notification_service import send_email_with_receipt, cleanup_temp_file

    service = BillingService(db)
    bill = service.get_bill(bill_id)
    pdf_path = None

    try:
        pdf_path = generate_receipt_pdf(bill)
        send_email_with_receipt(
            to_email=email,
            patient_name=bill.patient_name,
            bill_number=bill.bill_number,
            pdf_path=pdf_path,
        )
        return {"message": f"Receipt sent successfully to {email}"}
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
    finally:
        if pdf_path:
            cleanup_temp_file(pdf_path)


@router.post("/{bill_id}/send-whatsapp")
def send_receipt_whatsapp(
    bill_id: UUID,
    phone: Optional[str] = Body(None, embed=True, description="Override phone number"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Generate bill receipt PDF and send via WhatsApp."""
    from app.utils.receipt_generator import generate_receipt_pdf
    from app.utils.notification_service import send_whatsapp_with_receipt, cleanup_temp_file

    service = BillingService(db)
    bill = service.get_bill(bill_id)

    phone_number = phone or bill.mobile_no
    if not phone_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No phone number available for this patient",
        )

    pdf_path = None
    try:
        pdf_path = generate_receipt_pdf(bill)
        send_whatsapp_with_receipt(
            phone_number=phone_number,
            patient_name=bill.patient_name,
            bill_number=bill.bill_number,
            pdf_path=pdf_path,
        )
        return {"message": f"Receipt sent successfully via WhatsApp to {phone_number}"}
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
    finally:
        if pdf_path:
            cleanup_temp_file(pdf_path)
