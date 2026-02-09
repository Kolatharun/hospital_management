"""
Pydantic Schemas - Request/Response Validation

All schemas derived from frontend UI analysis.
"""

# Common
from app.schemas.common import (
    MessageResponse,
    PaginatedResponse,
    ErrorResponse,
    HealthCheckResponse,
)

# Auth
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    TokenResponse,
    RefreshTokenRequest,
    UserResponse,
    UserCreate,
    UserUpdate,
    PasswordChange,
)

# Patient
from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientListResponse,
    PatientSearchRequest,
    PatientWithAppointmentCreate,
)

# Department & Doctor
from app.schemas.department import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse,
    DepartmentListResponse,
    DoctorCreate,
    DoctorUpdate,
    DoctorResponse,
    DoctorListResponse,
    DoctorsByDepartmentResponse,
)

# Appointment
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentStatusUpdate,
    AppointmentResponse,
    AppointmentListResponse,
    TodayQueueResponse,
    QueueStats,
    CurrentPatientResponse,
    WaitingQueueItem,
    TVDisplayResponse,
    CallPatientRequest,
    AddBufferTimeRequest,
)

# Vitals
from app.schemas.vitals import (
    VitalsCreate,
    VitalsUpdate,
    VitalsResponse,
    TodayVitalsResponse,
)

# Prescription
from app.schemas.prescription import (
    MedicineCreate,
    MedicineResponse,
    PrescriptionCreate,
    PrescriptionUpdate,
    PrescriptionResponse,
    PrescriptionListResponse,
    SendToLabRequest,
    SendToPharmacyRequest,
    SendPrescriptionRequest,
)

# Billing
from app.schemas.billing import (
    BillLineItemCreate,
    BillLineItemResponse,
    BillCreate,
    BillUpdate,
    PaymentRequest,
    BillResponse,
    BillListResponse,
    DayPaymentSummary,
    BillReceiptResponse,
)

# Queue
from app.schemas.queue import (
    LabQueueItemCreate,
    LabQueueItemResponse,
    LabQueueListResponse,
    PharmacyQueueItemCreate,
    PharmacyQueueItemResponse,
    PharmacyQueueListResponse,
    QueueStatusUpdate,
)

__all__ = [
    # Common
    "MessageResponse",
    "PaginatedResponse",
    "ErrorResponse",
    "HealthCheckResponse",
    # Auth
    "LoginRequest",
    "LoginResponse",
    "TokenResponse",
    "RefreshTokenRequest",
    "UserResponse",
    "UserCreate",
    "UserUpdate",
    "PasswordChange",
    # Patient
    "PatientCreate",
    "PatientUpdate",
    "PatientResponse",
    "PatientListResponse",
    "PatientSearchRequest",
    "PatientWithAppointmentCreate",
    # Department & Doctor
    "DepartmentCreate",
    "DepartmentUpdate",
    "DepartmentResponse",
    "DepartmentListResponse",
    "DoctorCreate",
    "DoctorUpdate",
    "DoctorResponse",
    "DoctorListResponse",
    "DoctorsByDepartmentResponse",
    # Appointment
    "AppointmentCreate",
    "AppointmentUpdate",
    "AppointmentStatusUpdate",
    "AppointmentResponse",
    "AppointmentListResponse",
    "TodayQueueResponse",
    "QueueStats",
    "CurrentPatientResponse",
    "WaitingQueueItem",
    "TVDisplayResponse",
    "CallPatientRequest",
    "AddBufferTimeRequest",
    # Vitals
    "VitalsCreate",
    "VitalsUpdate",
    "VitalsResponse",
    "TodayVitalsResponse",
    # Prescription
    "MedicineCreate",
    "MedicineResponse",
    "PrescriptionCreate",
    "PrescriptionUpdate",
    "PrescriptionResponse",
    "PrescriptionListResponse",
    "SendToLabRequest",
    "SendToPharmacyRequest",
    "SendPrescriptionRequest",
    # Billing
    "BillLineItemCreate",
    "BillLineItemResponse",
    "BillCreate",
    "BillUpdate",
    "PaymentRequest",
    "BillResponse",
    "BillListResponse",
    "DayPaymentSummary",
    "BillReceiptResponse",
    # Queue
    "LabQueueItemCreate",
    "LabQueueItemResponse",
    "LabQueueListResponse",
    "PharmacyQueueItemCreate",
    "PharmacyQueueItemResponse",
    "PharmacyQueueListResponse",
    "QueueStatusUpdate",
]
