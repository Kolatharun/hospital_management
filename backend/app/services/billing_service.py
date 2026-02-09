"""
Billing Service - Bill and payment business logic
"""

import json
from datetime import date
from decimal import Decimal
from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.repositories.billing_repository import BillRepository, BillLineItemRepository
from app.repositories.appointment_repository import AppointmentRepository
from app.repositories.patient_repository import PatientRepository
from app.models.billing import Bill, BillLineItem, PaymentStatus, PaymentMethod, BillItemType
from app.models.user import User
from app.schemas.billing import (
    BillCreate,
    BillUpdate,
    PaymentRequest,
    BillResponse,
    BillLineItemResponse,
    DayPaymentSummary,
)


class BillingService:
    """Service for billing operations."""

    def __init__(self, db: Session):
        self.db = db
        self.bill_repo = BillRepository(db)
        self.line_item_repo = BillLineItemRepository(db)
        self.appointment_repo = AppointmentRepository(db)
        self.patient_repo = PatientRepository(db)

    @staticmethod
    def parse_other_charges(text: Optional[str]) -> Decimal:
        """Parse other_charges text field to extract numeric total.

        Extracts all numbers from text like "X-ray 500, ECG 300" and sums them.
        This matches the frontend parseOtherCharges function.
        """
        if not text:
            return Decimal("0.00")
        import re
        numbers = re.findall(r'\d+', text)
        if not numbers:
            return Decimal("0.00")
        return Decimal(str(sum(int(n) for n in numbers)))

    def create_bill(self, data: BillCreate, created_by: User) -> Bill:
        """Create a new bill."""
        # Verify patient exists
        patient = self.patient_repo.get_by_id(data.patient_id)
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found",
            )

        # Check if appointment already has a bill
        if data.appointment_id:
            if self.bill_repo.appointment_has_bill(data.appointment_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Appointment already has a bill",
                )
            appointment = self.appointment_repo.get_with_details(data.appointment_id)
        else:
            appointment = None

        # Generate bill number
        bill_number = self.bill_repo.generate_bill_number()

        # Calculate lab total and build lab investigations JSON
        lab_items = [item for item in data.line_items if item.item_type == 'lab']
        lab_total = sum(Decimal(str(item.amount)) for item in lab_items)
        lab_and_investigations = json.dumps([
            {"name": item.item_name, "amount": float(item.amount)}
            for item in lab_items
        ]) if lab_items else None

        # Calculate totals - include other_charges
        line_total = sum(item.amount for item in data.line_items)
        other_charges_amount = self.parse_other_charges(data.other_charges)
        subtotal = Decimal(str(data.consultation_fee)) + Decimal(str(line_total)) + other_charges_amount

        discount_amount = Decimal(str(data.discount_amount)) if data.discount_amount else Decimal("0.00")
        if data.discount_percent and data.discount_percent > 0:
            discount_amount = subtotal * (Decimal(str(data.discount_percent)) / Decimal("100"))

        total_amount = subtotal - discount_amount
        paid_amount = Decimal(str(data.paid_amount))

        # Calculate due amount - ensure it's 0 when fully paid
        if paid_amount >= total_amount:
            due_amount = Decimal("0.00")
            payment_status = PaymentStatus.PAID
        elif paid_amount > 0:
            due_amount = total_amount - paid_amount
            payment_status = PaymentStatus.PARTIAL
        else:
            due_amount = total_amount
            payment_status = PaymentStatus.PENDING

        bill_data = {
            "bill_number": bill_number,
            "appointment_id": data.appointment_id,
            "patient_id": data.patient_id,
            "created_by": created_by.id,
            "uhid": patient.mr_number,
            "patient_name": patient.full_name,
            "patient_age": str(patient.age) if patient.age else None,
            "patient_gender": patient.gender.value if patient.gender else None,
            "doctor_name": appointment.doctor.name if appointment and appointment.doctor else None,
            "speciality": appointment.doctor.speciality if appointment and appointment.doctor else None,
            "mobile_no": patient.phone,
            "patient_type": patient.patient_type.value if patient.patient_type else None,
            "token_number": appointment.op_number if appointment else None,
            "consultation_fee": Decimal(str(data.consultation_fee)),
            "other_charges": data.other_charges,
            "subtotal": subtotal,
            "discount_amount": discount_amount,
            "discount_percent": Decimal(str(data.discount_percent)),
            "discount_given_by": data.discount_given_by,
            "total_amount": total_amount,
            "paid_amount": paid_amount,
            "due_amount": due_amount,
            "payment_status": payment_status,
            "payment_method": PaymentMethod(data.payment_method) if data.payment_method else None,
            "payment_reference": data.payment_reference,
            "insurance_provider": data.insurance_provider,
            "insurance_policy_number": data.insurance_policy_number,
            "lab_total": lab_total,
            "lab_and_investigations": lab_and_investigations,
        }

        bill = self.bill_repo.create(bill_data)

        # Create line items
        for idx, item in enumerate(data.line_items):
            line_item_data = {
                "bill_id": bill.id,
                "item_type": BillItemType(item.item_type) if item.item_type else BillItemType.OTHER,
                "item_name": item.item_name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "amount": item.amount,
            }
            self.line_item_repo.create(line_item_data)

        # Refresh to get line items
        self.db.refresh(bill)
        return bill

    def get_bill(self, bill_id: UUID) -> Bill:
        """Get bill by ID."""
        bill = self.bill_repo.get_with_details(bill_id)
        if not bill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bill not found",
            )
        return bill

    def get_by_bill_number(self, bill_number: str) -> Bill:
        """Get bill by bill number."""
        bill = self.bill_repo.get_by_bill_number(bill_number)
        if not bill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bill not found",
            )
        return bill

    def record_payment(self, bill_id: UUID, data: PaymentRequest) -> Bill:
        """Record a payment on a bill."""
        bill = self.get_bill(bill_id)

        new_paid = Decimal(str(bill.paid_amount)) + Decimal(str(data.amount))
        total_amount = Decimal(str(bill.total_amount))

        if new_paid > total_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment amount exceeds due amount",
            )

        # Calculate new due amount - ensure it's 0 when fully paid
        if new_paid >= total_amount:
            new_due = Decimal("0.00")
            new_status = PaymentStatus.PAID
        else:
            new_due = total_amount - new_paid
            new_status = PaymentStatus.PARTIAL

        update_data = {
            "paid_amount": new_paid,
            "due_amount": new_due,
            "payment_status": new_status,
            "payment_method": PaymentMethod(data.payment_method),
            "payment_reference": data.payment_reference,
        }

        return self.bill_repo.update(bill_id, update_data)

    def get_today_bills(self) -> List[Bill]:
        """Get all bills created today."""
        return self.bill_repo.get_today_bills()

    def get_patient_bills(
        self,
        patient_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Bill]:
        """Get bills for a patient."""
        return self.bill_repo.get_patient_bills(patient_id, skip, limit)

    def get_day_payment_summary(self, target_date: Optional[date] = None) -> DayPaymentSummary:
        """Get payment summary for a day."""
        summary = self.bill_repo.get_day_payment_summary(target_date)
        return DayPaymentSummary(**summary)

    def get_day_summary(self, target_date: Optional[date] = None) -> DayPaymentSummary:
        """Alias for get_day_payment_summary."""
        return self.get_day_payment_summary(target_date)

    def get_by_appointment(self, appointment_id: UUID) -> Bill:
        """Get bill by appointment ID."""
        bill = self.bill_repo.get_by_appointment(appointment_id)
        if not bill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bill not found for this appointment",
            )
        return bill

    def get_pending_bills(self, target_date: Optional[date] = None) -> List[Bill]:
        """Get pending bills for today."""
        return self.bill_repo.get_pending_bills(target_date)

    def update_bill(self, bill_id: UUID, data: BillUpdate) -> Bill:
        """Update an existing bill."""
        bill = self.get_bill(bill_id)

        update_data = {}

        # Update consultation fee if provided
        if data.consultation_fee is not None:
            update_data["consultation_fee"] = Decimal(str(data.consultation_fee))

        # Update other fields
        if data.other_charges is not None:
            update_data["other_charges"] = data.other_charges
        if data.discount_percent is not None:
            update_data["discount_percent"] = Decimal(str(data.discount_percent))
        if data.discount_given_by is not None:
            update_data["discount_given_by"] = data.discount_given_by
        if data.insurance_provider is not None:
            update_data["insurance_provider"] = data.insurance_provider
        if data.insurance_policy_number is not None:
            update_data["insurance_policy_number"] = data.insurance_policy_number
        if data.payment_method is not None:
            update_data["payment_method"] = PaymentMethod(data.payment_method)
        if data.payment_reference is not None:
            update_data["payment_reference"] = data.payment_reference

        # Handle line items update
        if data.line_items is not None:
            # Delete existing line items
            for item in bill.line_items:
                self.db.delete(item)
            self.db.flush()

            # Create new line items
            for item in data.line_items:
                line_item_data = {
                    "bill_id": bill.id,
                    "item_type": BillItemType(item.item_type) if item.item_type else BillItemType.OTHER,
                    "item_name": item.item_name,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "amount": item.amount,
                }
                self.line_item_repo.create(line_item_data)

        # Recalculate totals - include other_charges
        consultation_fee = update_data.get("consultation_fee", bill.consultation_fee)
        other_charges_text = update_data.get("other_charges", bill.other_charges)
        other_charges_amount = self.parse_other_charges(other_charges_text)

        # Get updated line items
        self.db.refresh(bill)
        line_total = sum(Decimal(str(item.amount)) for item in bill.line_items)
        subtotal = Decimal(str(consultation_fee)) + line_total + other_charges_amount

        # Calculate lab total and build lab investigations JSON
        lab_items = [item for item in bill.line_items if item.item_type and item.item_type.value == 'lab']
        lab_total = sum(Decimal(str(item.amount)) for item in lab_items)
        lab_and_investigations = json.dumps([
            {"name": item.item_name, "amount": float(item.amount)}
            for item in lab_items
        ]) if lab_items else None

        discount_percent = update_data.get("discount_percent", bill.discount_percent) or Decimal("0.00")
        if data.discount_amount is not None:
            discount_amount = Decimal(str(data.discount_amount))
        elif discount_percent > 0:
            discount_amount = subtotal * (Decimal(str(discount_percent)) / Decimal("100"))
        else:
            discount_amount = Decimal("0.00")

        total_amount = subtotal - discount_amount
        paid_amount = Decimal(str(data.paid_amount)) if data.paid_amount is not None else bill.paid_amount

        # Calculate payment status and due amount
        if paid_amount >= total_amount:
            due_amount = Decimal("0.00")
            payment_status = PaymentStatus.PAID
        elif paid_amount > 0:
            due_amount = total_amount - paid_amount
            payment_status = PaymentStatus.PARTIAL
        else:
            due_amount = total_amount
            payment_status = PaymentStatus.PENDING

        update_data["subtotal"] = subtotal
        update_data["discount_amount"] = discount_amount
        update_data["total_amount"] = total_amount
        update_data["paid_amount"] = paid_amount
        update_data["due_amount"] = due_amount
        update_data["payment_status"] = payment_status
        update_data["lab_total"] = lab_total
        update_data["lab_and_investigations"] = lab_and_investigations

        updated_bill = self.bill_repo.update(bill_id, update_data)
        self.db.refresh(updated_bill)
        return updated_bill

    def search_bills(
        self,
        query: Optional[str] = None,
        patient_id: Optional[UUID] = None,
        mr_number: Optional[str] = None,
        bill_number: Optional[str] = None,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        payment_status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Bill]:
        """Search bills with various filters."""
        return self.bill_repo.search_bills(
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

    def build_response(self, bill: Bill) -> BillResponse:
        """Build bill response."""
        line_items = [
            BillLineItemResponse(
                id=item.id,
                item_name=item.item_name,
                item_type=item.item_type.value if item.item_type else "other",
                quantity=item.quantity,
                unit_price=item.unit_price,
                amount=item.amount,
            )
            for item in bill.line_items
        ]

        return BillResponse(
            id=bill.id,
            bill_number=bill.bill_number,
            appointment_id=bill.appointment_id,
            patient_id=bill.patient_id,
            created_by=bill.created_by,
            uhid=bill.uhid,
            patient_name=bill.patient_name,
            patient_age=bill.patient_age,
            patient_gender=bill.patient_gender,
            doctor_name=bill.doctor_name,
            speciality=bill.speciality,
            mobile_no=bill.mobile_no,
            patient_type=bill.patient_type,
            token_number=bill.token_number,
            consultation_fee=bill.consultation_fee,
            other_charges=bill.other_charges,
            subtotal=bill.subtotal,
            discount_amount=bill.discount_amount,
            discount_percent=bill.discount_percent,
            discount_given_by=bill.discount_given_by,
            total_amount=bill.total_amount,
            paid_amount=bill.paid_amount,
            due_amount=bill.due_amount,
            payment_status=bill.payment_status.value if bill.payment_status else "pending",
            payment_method=bill.payment_method.value if bill.payment_method else None,
            payment_reference=bill.payment_reference,
            insurance_provider=bill.insurance_provider,
            insurance_policy_number=bill.insurance_policy_number,
            lab_total=bill.lab_total or Decimal("0.00"),
            lab_and_investigations=bill.lab_and_investigations,
            line_items=line_items,
            created_at=bill.created_at.isoformat() if bill.created_at else None,
            updated_at=bill.updated_at.isoformat() if bill.updated_at else None,
        )
