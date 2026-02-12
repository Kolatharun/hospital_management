"""
Database Models - SQLAlchemy ORM Models

All models derived from frontend UI analysis.
"""

# Base
from app.models.base import BaseModel

# Auth
from app.models.user import User, UserRole

# Master data
from app.models.department import Department, DEFAULT_DEPARTMENTS
from app.models.doctor import Doctor, DEFAULT_DOCTORS

# Patient
from app.models.patient import Patient, Gender, MaritalStatus, PatientType

# Appointments
from app.models.appointment import Appointment, AppointmentStatus, QueueType

# Clinical
from app.models.vitals import PatientVitals
from app.models.prescription import Prescription, PrescriptionMedicine

# Billing
from app.models.billing import (
    Bill,
    BillLineItem,
    PaymentStatus,
    PaymentMethod,
    BillItemType,
)

# Queues
from app.models.queue import LabQueueItem, PharmacyQueueItem, QueueStatus

# Documents
from app.models.document import PatientDocument

# Master data tables
from app.models.master_data import ComplaintMaster, DiagnosisMaster, LabTestMaster

__all__ = [
    # Base
    "BaseModel",
    # Auth
    "User",
    "UserRole",
    # Master
    "Department",
    "DEFAULT_DEPARTMENTS",
    "Doctor",
    "DEFAULT_DOCTORS",
    # Patient
    "Patient",
    "Gender",
    "MaritalStatus",
    "PatientType",
    # Appointments
    "Appointment",
    "AppointmentStatus",
    "QueueType",
    # Clinical
    "PatientVitals",
    "Prescription",
    "PrescriptionMedicine",
    # Billing
    "Bill",
    "BillLineItem",
    "PaymentStatus",
    "PaymentMethod",
    "BillItemType",
    # Queues
    "LabQueueItem",
    "PharmacyQueueItem",
    "QueueStatus",
    # Documents
    "PatientDocument",
    # Master Data
    "ComplaintMaster",
    "DiagnosisMaster",
    "LabTestMaster",
]
