"""
Service Layer - Business Logic

Services contain all business logic and orchestrate
between controllers and repositories.

Services should:
- Validate business rules
- Coordinate multiple repository operations
- Handle transactions
- Return DTOs/schemas (not raw models where appropriate)
"""

from app.services.auth_service import AuthService
from app.services.patient_service import PatientService
from app.services.appointment_service import AppointmentService
from app.services.vitals_service import VitalsService
from app.services.billing_service import BillingService
from app.services.department_service import DepartmentService, DoctorService
from app.services.queue_service import LabQueueService, PharmacyQueueService
from app.services.prescription_service import PrescriptionService

__all__ = [
    "AuthService",
    "PatientService",
    "AppointmentService",
    "VitalsService",
    "BillingService",
    "DepartmentService",
    "DoctorService",
    "LabQueueService",
    "PharmacyQueueService",
    "PrescriptionService",
]
