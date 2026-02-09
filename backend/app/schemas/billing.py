"""
Billing Schemas - Bill and payment related schemas

Derived from frontend BillingSection.tsx form fields.
"""

from decimal import Decimal
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class BillLineItemBase(BaseModel):
    """Base bill line item fields."""

    item_name: str = Field(..., max_length=200)
    item_type: str = Field(default="other", description="consultation, lab, pharmacy, procedure, other")
    quantity: Decimal = Field(default=Decimal("1.00"), ge=0)
    unit_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    amount: Decimal = Field(default=Decimal("0.00"), ge=0)


class BillLineItemCreate(BillLineItemBase):
    """Schema for creating a bill line item."""
    pass


class BillLineItemResponse(BillLineItemBase):
    """Bill line item response."""

    id: UUID

    class Config:
        from_attributes = True


class BillBase(BaseModel):
    """Base bill fields from frontend form."""

    appointment_id: Optional[UUID] = None
    consultation_fee: Decimal = Field(default=Decimal("0.00"), ge=0)
    other_charges: Optional[str] = Field(default=None, max_length=200)
    discount_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    discount_percent: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)
    discount_given_by: Optional[str] = Field(default=None, max_length=100)

    # Insurance
    insurance_provider: Optional[str] = Field(default=None, max_length=100)
    insurance_policy_number: Optional[str] = Field(default=None, max_length=100)


class BillCreate(BillBase):
    """Schema for creating a bill."""

    patient_id: UUID
    line_items: List[BillLineItemCreate] = Field(default_factory=list)

    # Payment
    paid_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    payment_method: Optional[str] = Field(default=None, description="cash, card, upi")
    payment_reference: Optional[str] = Field(default=None, max_length=100)

    class Config:
        json_schema_extra = {
            "example": {
                "patient_id": "550e8400-e29b-41d4-a716-446655440000",
                "appointment_id": "660e8400-e29b-41d4-a716-446655440001",
                "consultation_fee": 500.00,
                "line_items": [
                    {"item_name": "ECG", "item_type": "lab", "amount": 200.00}
                ],
                "paid_amount": 700.00,
                "payment_method": "cash",
            }
        }


class BillUpdate(BaseModel):
    """Schema for updating a bill."""

    consultation_fee: Optional[Decimal] = Field(default=None, ge=0)
    other_charges: Optional[str] = Field(default=None, max_length=200)
    discount_amount: Optional[Decimal] = Field(default=None, ge=0)
    discount_percent: Optional[Decimal] = Field(default=None, ge=0, le=100)
    discount_given_by: Optional[str] = Field(default=None, max_length=100)
    insurance_provider: Optional[str] = Field(default=None, max_length=100)
    insurance_policy_number: Optional[str] = Field(default=None, max_length=100)
    line_items: Optional[List[BillLineItemCreate]] = None
    paid_amount: Optional[Decimal] = Field(default=None, ge=0)
    payment_method: Optional[str] = Field(default=None, description="cash, card, upi")
    payment_reference: Optional[str] = Field(default=None, max_length=100)


class PaymentRequest(BaseModel):
    """Schema for recording a payment."""

    amount: Decimal = Field(..., gt=0)
    payment_method: str = Field(..., description="cash, card, upi")
    payment_reference: Optional[str] = Field(default=None, max_length=100)

    @field_validator("payment_method")
    @classmethod
    def validate_payment_method(cls, v: str) -> str:
        valid = ["cash", "card", "upi"]
        if v.lower() not in valid:
            raise ValueError(f"Payment method must be one of: {valid}")
        return v.lower()


class BillResponse(BillBase):
    """Bill response schema."""

    id: UUID
    bill_number: str
    patient_id: UUID
    created_by: Optional[UUID] = None

    # Denormalized fields
    uhid: Optional[str] = None
    patient_name: str
    patient_age: Optional[str] = None
    patient_gender: Optional[str] = None
    doctor_name: Optional[str] = None
    speciality: Optional[str] = None
    mobile_no: Optional[str] = None
    patient_type: Optional[str] = None
    token_number: Optional[str] = None

    # Calculated amounts
    subtotal: Decimal
    total_amount: Decimal
    paid_amount: Decimal
    due_amount: Decimal

    # Lab and Investigations Summary
    lab_total: Decimal = Decimal("0.00")
    lab_and_investigations: Optional[str] = None

    # Payment
    payment_status: str
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None

    # Line items
    line_items: List[BillLineItemResponse] = Field(default_factory=list)

    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class BillListResponse(BaseModel):
    """Paginated bill list response."""

    items: List[BillResponse]
    total: int
    page: int
    page_size: int


class DayPaymentSummary(BaseModel):
    """Daily payment summary for DayPayments.tsx."""

    date: str
    total_bills: int
    total_amount: Decimal
    total_paid: Decimal
    total_due: Decimal
    cash_amount: Decimal
    card_amount: Decimal
    upi_amount: Decimal
    paid_count: int
    partial_count: int
    pending_count: int


class BillReceiptResponse(BillResponse):
    """Extended bill response for receipt printing."""

    clinic_name: str = "Balaji Heart Center"
    clinic_address: str = "Hyderabad, Telangana"
    clinic_phone: str = "+91 9876543210"


# Aliases for backward compatibility
PaymentRecord = PaymentRequest
DaySummaryResponse = DayPaymentSummary
