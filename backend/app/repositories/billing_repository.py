"""
Billing Repository - Bill database operations
"""

from datetime import date
from decimal import Decimal
from typing import Optional, List, Dict
from uuid import UUID

from sqlalchemy import func, text
from sqlalchemy.orm import Session, joinedload

from app.repositories.base import BaseRepository
from app.models.billing import Bill, BillLineItem, PaymentStatus, PaymentMethod


class BillRepository(BaseRepository[Bill]):
    """Repository for Bill model operations."""

    def __init__(self, db: Session):
        super().__init__(Bill, db)

    def get_by_bill_number(self, bill_number: str) -> Optional[Bill]:
        """Get bill by bill number."""
        return self.db.query(Bill).options(
            joinedload(Bill.line_items),
            joinedload(Bill.patient),
        ).filter(
            Bill.bill_number == bill_number,
            Bill.is_deleted == False,
        ).first()

    def get_by_appointment(self, appointment_id: UUID) -> Optional[Bill]:
        """Get bill for an appointment."""
        return self.db.query(Bill).options(
            joinedload(Bill.line_items),
        ).filter(
            Bill.appointment_id == appointment_id,
            Bill.is_deleted == False,
        ).first()

    def get_with_details(self, bill_id: UUID) -> Optional[Bill]:
        """Get bill with all details."""
        return self.db.query(Bill).options(
            joinedload(Bill.line_items),
            joinedload(Bill.patient),
            joinedload(Bill.appointment),
        ).filter(
            Bill.id == bill_id,
            Bill.is_deleted == False,
        ).first()

    def get_patient_bills(
        self,
        patient_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Bill]:
        """Get bills for a patient."""
        return self.db.query(Bill).options(
            joinedload(Bill.line_items),
        ).filter(
            Bill.patient_id == patient_id,
            Bill.is_deleted == False,
        ).order_by(Bill.created_at.desc()).offset(skip).limit(limit).all()

    def get_today_bills(self) -> List[Bill]:
        """Get all bills created today."""
        today = date.today()
        return self.db.query(Bill).options(
            joinedload(Bill.line_items),
        ).filter(
            func.date(Bill.created_at) == today,
            Bill.is_deleted == False,
        ).order_by(Bill.created_at.desc()).all()

    def get_day_payment_summary(self, target_date: Optional[date] = None) -> Dict:
        """Get payment summary for a day."""
        target = target_date or date.today()

        bills = self.db.query(Bill).filter(
            func.date(Bill.created_at) == target,
            Bill.is_deleted == False,
        ).all()

        summary = {
            "date": target.isoformat(),
            "total_bills": len(bills),
            "total_amount": Decimal("0.00"),
            "total_paid": Decimal("0.00"),
            "total_due": Decimal("0.00"),
            "cash_amount": Decimal("0.00"),
            "card_amount": Decimal("0.00"),
            "upi_amount": Decimal("0.00"),
            "paid_count": 0,
            "partial_count": 0,
            "pending_count": 0,
        }

        for bill in bills:
            summary["total_amount"] += bill.total_amount
            summary["total_paid"] += bill.paid_amount
            summary["total_due"] += bill.due_amount

            if bill.payment_method == PaymentMethod.CASH:
                summary["cash_amount"] += bill.paid_amount
            elif bill.payment_method == PaymentMethod.CARD:
                summary["card_amount"] += bill.paid_amount
            elif bill.payment_method == PaymentMethod.UPI:
                summary["upi_amount"] += bill.paid_amount

            if bill.payment_status == PaymentStatus.PAID:
                summary["paid_count"] += 1
            elif bill.payment_status == PaymentStatus.PARTIAL:
                summary["partial_count"] += 1
            else:
                summary["pending_count"] += 1

        return summary

    def generate_bill_number(self) -> str:
        """Generate next bill number."""
        today = date.today()
        date_str = today.strftime("%Y%m%d")
        result = self.db.execute(text("SELECT nextval('bill_number_seq')"))
        seq_val = result.scalar()
        return f"BLL-{date_str}-{seq_val:04d}"

    def appointment_has_bill(self, appointment_id: UUID) -> bool:
        """Check if appointment already has a bill."""
        return self.db.query(Bill.id).filter(
            Bill.appointment_id == appointment_id,
            Bill.is_deleted == False,
        ).first() is not None

    def get_pending_bills(self, target_date: Optional[date] = None) -> List[Bill]:
        """Get pending bills for a date."""
        target = target_date or date.today()
        return self.db.query(Bill).options(
            joinedload(Bill.line_items),
        ).filter(
            func.date(Bill.created_at) == target,
            Bill.payment_status.in_([PaymentStatus.PENDING, PaymentStatus.PARTIAL]),
            Bill.is_deleted == False,
        ).order_by(Bill.created_at.desc()).all()

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
        q = self.db.query(Bill).options(
            joinedload(Bill.line_items),
        ).filter(Bill.is_deleted == False)

        # Text search on patient name, MR number, bill number
        if query:
            search_term = f"%{query}%"
            q = q.filter(
                (Bill.patient_name.ilike(search_term)) |
                (Bill.uhid.ilike(search_term)) |
                (Bill.bill_number.ilike(search_term)) |
                (Bill.mobile_no.ilike(search_term))
            )

        if patient_id:
            q = q.filter(Bill.patient_id == patient_id)

        if mr_number:
            q = q.filter(Bill.uhid.ilike(f"%{mr_number}%"))

        if bill_number:
            q = q.filter(Bill.bill_number.ilike(f"%{bill_number}%"))

        if from_date:
            q = q.filter(func.date(Bill.created_at) >= from_date)

        if to_date:
            q = q.filter(func.date(Bill.created_at) <= to_date)

        if payment_status:
            try:
                status_enum = PaymentStatus(payment_status)
                q = q.filter(Bill.payment_status == status_enum)
            except ValueError:
                pass  # Invalid status, ignore filter

        return q.order_by(Bill.created_at.desc()).offset(skip).limit(limit).all()


class BillLineItemRepository(BaseRepository[BillLineItem]):
    """Repository for BillLineItem model operations."""

    def __init__(self, db: Session):
        super().__init__(BillLineItem, db)

    def get_by_bill(self, bill_id: UUID) -> List[BillLineItem]:
        """Get all line items for a bill."""
        return self.db.query(BillLineItem).filter(
            BillLineItem.bill_id == bill_id,
            BillLineItem.is_deleted == False,
        ).all()
