"""
Department and Doctor Service
"""

from decimal import Decimal
from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.repositories.department_repository import DepartmentRepository, DoctorRepository
from app.models.department import Department
from app.models.doctor import Doctor
from app.schemas.department import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse,
    DoctorCreate,
    DoctorUpdate,
    DoctorResponse,
    DoctorsByDepartmentResponse,
)


class DepartmentService:
    """Service for department operations."""

    def __init__(self, db: Session):
        self.db = db
        self.dept_repo = DepartmentRepository(db)

    def get_all_departments(self) -> List[Department]:
        """Get all active departments."""
        return self.dept_repo.get_active_departments()

    def get_department(self, department_id: UUID) -> Department:
        """Get department by ID."""
        dept = self.dept_repo.get_by_id(department_id)
        if not dept:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found",
            )
        return dept

    def create_department(self, data: DepartmentCreate) -> Department:
        """Create a new department."""
        # Check if name/code exists
        if self.dept_repo.get_by_name(data.name):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department name already exists",
            )
        if self.dept_repo.get_by_code(data.code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department code already exists",
            )

        dept_data = data.model_dump()
        return self.dept_repo.create(dept_data)

    def update_department(self, department_id: UUID, data: DepartmentUpdate) -> Department:
        """Update department."""
        dept = self.get_department(department_id)
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        if not update_dict:
            return dept
        return self.dept_repo.update(department_id, update_dict)

    def build_response(self, dept: Department) -> DepartmentResponse:
        """Build department response."""
        return DepartmentResponse(
            id=dept.id,
            name=dept.name,
            code=dept.code,
            description=dept.description,
            base_consultation_fee=dept.base_consultation_fee,
            is_active=dept.is_active,
            created_at=dept.created_at.isoformat() if dept.created_at else None,
        )


class DoctorService:
    """Service for doctor operations."""

    def __init__(self, db: Session):
        self.db = db
        self.doctor_repo = DoctorRepository(db)
        self.dept_repo = DepartmentRepository(db)

    def get_all_doctors(self) -> List[Doctor]:
        """Get all available doctors."""
        return self.doctor_repo.get_available_doctors()

    def get_doctor(self, doctor_id: UUID) -> Doctor:
        """Get doctor by ID."""
        doctor = self.doctor_repo.get_with_department(doctor_id)
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found",
            )
        return doctor

    def get_by_department(self, department_id: UUID) -> List[Doctor]:
        """Get doctors by department."""
        return self.doctor_repo.get_by_department(department_id)

    def get_doctors_grouped(self) -> List[DoctorsByDepartmentResponse]:
        """Get doctors grouped by department."""
        grouped = self.doctor_repo.get_doctors_grouped_by_department()
        result = []
        for dept_id, data in grouped.items():
            if data["department_id"]:
                result.append(DoctorsByDepartmentResponse(
                    department_id=data["department_id"],
                    department_name=data["department_name"],
                    doctors=[self.build_response(d) for d in data["doctors"]],
                ))
        return result

    def create_doctor(self, data: DoctorCreate) -> Doctor:
        """Create a new doctor."""
        doctor_data = data.model_dump()
        return self.doctor_repo.create(doctor_data)

    def update_doctor(self, doctor_id: UUID, data: DoctorUpdate) -> Doctor:
        """Update doctor."""
        doctor = self.get_doctor(doctor_id)
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        if not update_dict:
            return doctor
        return self.doctor_repo.update(doctor_id, update_dict)

    def build_response(self, doctor: Doctor) -> DoctorResponse:
        """Build doctor response."""
        dept = doctor.department
        effective_fee = doctor.consultation_fee or (dept.base_consultation_fee if dept else Decimal("300.00"))

        return DoctorResponse(
            id=doctor.id,
            name=doctor.name,
            department_id=doctor.department_id,
            department_name=dept.name if dept else None,
            user_id=doctor.user_id,
            speciality=doctor.speciality,
            qualification=doctor.qualification,
            registration_number=doctor.registration_number,
            phone=doctor.phone,
            email=doctor.email,
            room=doctor.room,
            consultation_fee=doctor.consultation_fee,
            is_available=doctor.is_available,
            effective_fee=effective_fee,
            created_at=doctor.created_at.isoformat() if doctor.created_at else None,
        )
