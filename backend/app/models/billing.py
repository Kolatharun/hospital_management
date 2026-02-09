"""
Billing Models - Bill and BillLineItem

Derived from frontend analysis:
- BillingSection.tsx: All billing fields and payment options
- BillsList.tsx: Bills list display
- DayPayments.tsx: Daily payment summary

Database Fields:
Bill - Invoice header with totals and payment info
BillLineItem - Individual charges (lab items, etc.)
"""

import enum
from decimal import Decimal
from typing import TYPE_CHECKING, List

from sqlalchemy import Column, String, Numeric, Enum, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.patient import Patient
    from app.models.appointment import Appointment
    from app.models.user import User


class PaymentStatus(str, enum.Enum):
    """Payment status from frontend BillingSection.tsx."""
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"


class PaymentMethod(str, enum.Enum):
    """Payment methods from frontend dropdown."""
    CASH = "cash"
    CARD = "card"
    UPI = "upi"


class BillItemType(str, enum.Enum):
    """Types of bill line items."""
    CONSULTATION = "consultation"
    LAB = "lab"
    PHARMACY = "pharmacy"
    PROCEDURE = "procedure"
    OTHER = "other"


class Bill(BaseModel):
    """
    Patient bill/invoice.

    Contains billing details, payment info, and links to appointment.
    """

    __tablename__ = "bills"

    # Unique identifier
    bill_number = Column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
        comment="Bill number (BLL-YYYYMMDD-XXX format)",
    )

    # Links
    appointment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("appointments.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
        index=True,
        comment="Link to appointment",
    )

    patient_id = Column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Link to patient",
    )

    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="Staff who created the bill",
    )

    # Display fields (denormalized for receipt printing)
    uhid = Column(
        String(50),
        nullable=True,
        comment="Unique Hospital ID",
    )

    patient_name = Column(
        String(200),
        nullable=False,
        comment="Patient name for receipt",
    )

    patient_age = Column(
        String(10),
        nullable=True,
        comment="Patient age for receipt",
    )

    patient_gender = Column(
        String(10),
        nullable=True,
        comment="Patient gender for receipt",
    )

    doctor_name = Column(
        String(200),
        nullable=True,
        comment="Doctor name for receipt",
    )

    speciality = Column(
        String(100),
        nullable=True,
        comment="Department/speciality",
    )

    mobile_no = Column(
        String(15),
        nullable=True,
        comment="Patient mobile for receipt",
    )

    patient_type = Column(
        String(50),
        nullable=True,
        comment="Patient type",
    )

    token_number = Column(
        String(20),
        nullable=True,
        comment="Token/OP number",
    )

    # Amounts
    consultation_fee = Column(
        Numeric(10, 2),
        nullable=False,
        default=Decimal("0.00"),
        comment="Consultation fee",
    )

    other_charges = Column(
        String(200),
        nullable=True,
        comment="Description of other charges",
    )

    subtotal = Column(
        Numeric(10, 2),
        nullable=False,
        default=Decimal("0.00"),
        comment="Subtotal before discount",
    )

    discount_amount = Column(
        Numeric(10, 2),
        nullable=False,
        default=Decimal("0.00"),
        comment="Discount amount",
    )

    discount_percent = Column(
        Numeric(5, 2),
        nullable=False,
        default=Decimal("0.00"),
        comment="Discount percentage",
    )

    discount_given_by = Column(
        String(100),
        nullable=True,
        comment="Who authorized the discount",
    )

    total_amount = Column(
        Numeric(10, 2),
        nullable=False,
        default=Decimal("0.00"),
        comment="Total amount after discount",
    )

    paid_amount = Column(
        Numeric(10, 2),
        nullable=False,
        default=Decimal("0.00"),
        comment="Amount paid",
    )

    due_amount = Column(
        Numeric(10, 2),
        nullable=False,
        default=Decimal("0.00"),
        comment="Amount due",
    )

    # Payment details
    payment_status = Column(
        Enum(PaymentStatus, name="payment_status_enum", native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=PaymentStatus.PENDING,
        index=True,
        comment="Payment status",
    )

    payment_method = Column(
        Enum(PaymentMethod, name="payment_method_enum", native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=True,
        comment="Payment method used",
    )

    payment_reference = Column(
        String(100),
        nullable=True,
        comment="Transaction reference number",
    )

    # Insurance
    insurance_provider = Column(
        String(100),
        nullable=True,
        comment="Insurance provider name",
    )

    insurance_policy_number = Column(
        String(100),
        nullable=True,
        comment="Insurance policy number",
    )

    # Lab and Investigations Summary (denormalized for quick access and receipt)
    lab_total = Column(
        Numeric(10, 2),
        nullable=False,
        default=Decimal("0.00"),
        comment="Total amount of lab/investigation items",
    )

    lab_and_investigations = Column(
        Text,
        nullable=True,
        comment="JSON array of lab items: [{name, amount}]",
    )

    # Relationships
    appointment = relationship(
        "Appointment",
        backref="bill",
        foreign_keys=[appointment_id],
        uselist=False,
    )

    patient = relationship(
        "Patient",
        backref="bills",
        foreign_keys=[patient_id],
    )

    creator = relationship(
        "User",
        backref="created_bills",
        foreign_keys=[created_by],
    )

    line_items = relationship(
        "BillLineItem",
        back_populates="bill",
        cascade="all, delete-orphan",
    )

    # Indexes
    __table_args__ = (
        Index("ix_bills_created_at_status", "created_at", "payment_status"),
        Index("ix_bills_patient_created", "patient_id", "created_at"),
    )

    def calculate_totals(self) -> None:
        """Recalculate bill totals from line items."""
        line_total = sum(item.amount for item in self.line_items)
        self.subtotal = self.consultation_fee + line_total

        if self.discount_percent > 0:
            self.discount_amount = self.subtotal * (self.discount_percent / 100)

        self.total_amount = self.subtotal - self.discount_amount
        self.due_amount = self.total_amount - self.paid_amount

        # Update payment status
        if self.paid_amount >= self.total_amount:
            self.payment_status = PaymentStatus.PAID
        elif self.paid_amount > 0:
            self.payment_status = PaymentStatus.PARTIAL
        else:
            self.payment_status = PaymentStatus.PENDING

    def __repr__(self) -> str:
        return f"<Bill(id={self.id}, number={self.bill_number}, total={self.total_amount})>"


class BillLineItem(BaseModel):
    """
    Individual line item on a bill.

    Used for lab tests, pharmacy items, procedures, etc.
    """

    __tablename__ = "bill_line_items"

    # Link to bill
    bill_id = Column(
        UUID(as_uuid=True),
        ForeignKey("bills.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Link to parent bill",
    )

    # Item details
    item_type = Column(
        Enum(BillItemType, name="bill_item_type_enum", native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=BillItemType.OTHER,
        comment="Type of item",
    )

    item_name = Column(
        String(200),
        nullable=False,
        comment="Item description",
    )

    quantity = Column(
        Numeric(10, 2),
        nullable=False,
        default=Decimal("1.00"),
        comment="Quantity",
    )

    unit_price = Column(
        Numeric(10, 2),
        nullable=False,
        default=Decimal("0.00"),
        comment="Price per unit",
    )

    amount = Column(
        Numeric(10, 2),
        nullable=False,
        default=Decimal("0.00"),
        comment="Total amount (quantity * unit_price)",
    )

    # Relationship
    bill = relationship(
        "Bill",
        back_populates="line_items",
    )

    def calculate_amount(self) -> None:
        """Calculate amount from quantity and unit price."""
        self.amount = self.quantity * self.unit_price

    def __repr__(self) -> str:
        return f"<BillLineItem(id={self.id}, item={self.item_name}, amount={self.amount})>"
