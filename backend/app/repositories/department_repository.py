"""
Department and Doctor Repositories
"""

from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.repositories.base import BaseRepository
from app.models.department import Department
from app.models.doctor import Doctor


class DepartmentRepository(BaseRepository[Department]):
    """Repository for Department model operations."""

    def __init__(self, db: Session):
        super().__init__(Department, db)

    def get_by_code(self, code: str) -> Optional[Department]:
        """Get department by code."""
        return self.db.query(Department).filter(
            Department.code == code,
            Department.is_deleted == False,
        ).first()

    def get_by_name(self, name: str) -> Optional[Department]:
        """Get department by name."""
        return self.db.query(Department).filter(
            Department.name == name,
            Department.is_deleted == False,
        ).first()

    def get_active_departments(self) -> List[Department]:
        """Get all active departments."""
        return self.db.query(Department).filter(
            Department.is_active == True,
            Department.is_deleted == False,
        ).order_by(Department.name).all()


class DoctorRepository(BaseRepository[Doctor]):
    """Repository for Doctor model operations."""

    def __init__(self, db: Session):
        super().__init__(Doctor, db)

    def get_with_department(self, doctor_id: UUID) -> Optional[Doctor]:
        """Get doctor with department details."""
        return self.db.query(Doctor).options(
            joinedload(Doctor.department),
        ).filter(
            Doctor.id == doctor_id,
            Doctor.is_deleted == False,
        ).first()

    def get_by_user_id(self, user_id: UUID) -> Optional[Doctor]:
        """Get doctor by user ID."""
        return self.db.query(Doctor).filter(
            Doctor.user_id == user_id,
            Doctor.is_deleted == False,
        ).first()

    def get_by_department(self, department_id: UUID) -> List[Doctor]:
        """Get doctors by department."""
        return self.db.query(Doctor).options(
            joinedload(Doctor.department),
        ).filter(
            Doctor.department_id == department_id,
            Doctor.is_available == True,
            Doctor.is_deleted == False,
        ).order_by(Doctor.name).all()

    def get_available_doctors(self) -> List[Doctor]:
        """Get all available doctors."""
        return self.db.query(Doctor).options(
            joinedload(Doctor.department),
        ).filter(
            Doctor.is_available == True,
            Doctor.is_deleted == False,
        ).order_by(Doctor.name).all()

    def get_doctors_grouped_by_department(self) -> dict:
        """Get doctors grouped by department for dropdown."""
        doctors = self.get_available_doctors()
        grouped = {}
        for doctor in doctors:
            dept_id = str(doctor.department_id) if doctor.department_id else "unassigned"
            dept_name = doctor.department.name if doctor.department else "Unassigned"
            if dept_id not in grouped:
                grouped[dept_id] = {
                    "department_id": doctor.department_id,
                    "department_name": dept_name,
                    "doctors": [],
                }
            grouped[dept_id]["doctors"].append(doctor)
        return grouped
