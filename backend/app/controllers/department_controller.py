"""
Department Controller - Department and Doctor management endpoints
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.services.department_service import DepartmentService, DoctorService
from app.schemas.department import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse,
    DoctorCreate,
    DoctorUpdate,
    DoctorResponse,
    DoctorsByDepartmentResponse,
)

router = APIRouter(tags=["Departments & Doctors"])


# Department endpoints
@router.get("/departments", response_model=list[DepartmentResponse])
def get_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all active departments."""
    service = DepartmentService(db)
    departments = service.get_all_departments()
    return [service.build_response(d) for d in departments]


@router.post("/departments", response_model=DepartmentResponse)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Create a new department."""
    service = DepartmentService(db)
    department = service.create_department(data)
    return service.build_response(department)


@router.get("/departments/{department_id}", response_model=DepartmentResponse)
def get_department(
    department_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get department by ID."""
    service = DepartmentService(db)
    department = service.get_department(department_id)
    return service.build_response(department)


@router.put("/departments/{department_id}", response_model=DepartmentResponse)
def update_department(
    department_id: UUID,
    data: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Update department."""
    service = DepartmentService(db)
    department = service.update_department(department_id, data)
    return service.build_response(department)


# Doctor endpoints
@router.get("/doctors", response_model=list[DoctorResponse])
def get_doctors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all available doctors."""
    service = DoctorService(db)
    doctors = service.get_all_doctors()
    return [service.build_response(d) for d in doctors]


@router.get("/doctors/grouped", response_model=list[DoctorsByDepartmentResponse])
def get_doctors_grouped(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get doctors grouped by department for dropdown."""
    service = DoctorService(db)
    return service.get_doctors_grouped()


@router.get("/doctors/department/{department_id}", response_model=list[DoctorResponse])
def get_doctors_by_department(
    department_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get doctors by department."""
    service = DoctorService(db)
    doctors = service.get_by_department(department_id)
    return [service.build_response(d) for d in doctors]


@router.post("/doctors", response_model=DoctorResponse)
def create_doctor(
    data: DoctorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Create a new doctor."""
    service = DoctorService(db)
    doctor = service.create_doctor(data)
    return service.build_response(doctor)


@router.get("/doctors/{doctor_id}", response_model=DoctorResponse)
def get_doctor(
    doctor_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get doctor by ID."""
    service = DoctorService(db)
    doctor = service.get_doctor(doctor_id)
    return service.build_response(doctor)


@router.put("/doctors/{doctor_id}", response_model=DoctorResponse)
def update_doctor(
    doctor_id: UUID,
    data: DoctorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Update doctor."""
    service = DoctorService(db)
    doctor = service.update_doctor(doctor_id, data)
    return service.build_response(doctor)
