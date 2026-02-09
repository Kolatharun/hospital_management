"""
Controllers - API Endpoints

Controllers define API routes and handle HTTP requests.
They should:
- Validate request data (via Pydantic schemas)
- Call appropriate services
- Return responses
- Handle HTTP status codes

Controllers should NOT contain business logic.
"""

from app.controllers.auth_controller import router as auth_router
from app.controllers.patient_controller import router as patient_router
from app.controllers.appointment_controller import router as appointment_router
from app.controllers.vitals_controller import router as vitals_router
from app.controllers.billing_controller import router as billing_router
from app.controllers.department_controller import router as department_router
from app.controllers.queue_controller import router as queue_router
from app.controllers.prescription_controller import router as prescription_router
from app.controllers.doctor_controller import router as doctor_router

__all__ = [
    "auth_router",
    "patient_router",
    "appointment_router",
    "vitals_router",
    "billing_router",
    "department_router",
    "queue_router",
    "prescription_router",
    "doctor_router",
]
