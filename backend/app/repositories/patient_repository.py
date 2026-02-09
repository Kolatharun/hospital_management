"""
Patient Repository - Patient database operations
"""

from datetime import date
from typing import Optional, List
from uuid import UUID

from sqlalchemy import or_, func, text
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from app.models.patient import Patient


class PatientRepository(BaseRepository[Patient]):
    """Repository for Patient model operations."""

    def __init__(self, db: Session):
        super().__init__(Patient, db)

    def get_by_mr_number(self, mr_number: str) -> Optional[Patient]:
        """Get patient by MR number."""
        return self.db.query(Patient).filter(
            Patient.mr_number == mr_number,
            Patient.is_deleted == False,
        ).first()

    def get_by_phone(self, phone: str) -> Optional[Patient]:
        """Get patient by phone number."""
        return self.db.query(Patient).filter(
            Patient.phone == phone,
            Patient.is_deleted == False,
        ).first()

    def search(
        self,
        query: str,
        search_type: str = "all",
        skip: int = 0,
        limit: int = 20,
    ) -> List[Patient]:
        """
        Search patients by name, phone, or MR number.

        Args:
            query: Search query
            search_type: 'all', 'name', 'phone', 'mr_number'
            skip: Pagination offset
            limit: Pagination limit
        """
        base_query = self.db.query(Patient).filter(Patient.is_deleted == False)
        search_pattern = f"%{query}%"

        if search_type == "name":
            base_query = base_query.filter(
                or_(
                    Patient.first_name.ilike(search_pattern),
                    Patient.last_name.ilike(search_pattern),
                    func.concat(Patient.first_name, ' ', Patient.last_name).ilike(search_pattern),
                )
            )
        elif search_type == "phone":
            base_query = base_query.filter(Patient.phone.ilike(search_pattern))
        elif search_type == "mr_number":
            base_query = base_query.filter(Patient.mr_number.ilike(search_pattern))
        else:  # all
            base_query = base_query.filter(
                or_(
                    Patient.first_name.ilike(search_pattern),
                    Patient.last_name.ilike(search_pattern),
                    Patient.phone.ilike(search_pattern),
                    Patient.mr_number.ilike(search_pattern),
                )
            )

        return base_query.order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()

    def count_search(self, query: str, search_type: str = "all") -> int:
        """Count search results."""
        base_query = self.db.query(func.count(Patient.id)).filter(Patient.is_deleted == False)
        search_pattern = f"%{query}%"

        if search_type == "name":
            base_query = base_query.filter(
                or_(
                    Patient.first_name.ilike(search_pattern),
                    Patient.last_name.ilike(search_pattern),
                )
            )
        elif search_type == "phone":
            base_query = base_query.filter(Patient.phone.ilike(search_pattern))
        elif search_type == "mr_number":
            base_query = base_query.filter(Patient.mr_number.ilike(search_pattern))
        else:
            base_query = base_query.filter(
                or_(
                    Patient.first_name.ilike(search_pattern),
                    Patient.last_name.ilike(search_pattern),
                    Patient.phone.ilike(search_pattern),
                    Patient.mr_number.ilike(search_pattern),
                )
            )

        return base_query.scalar() or 0

    def get_recent_registrations(
        self,
        days: int = 7,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Patient]:
        """Get patients registered in the last N days."""
        from datetime import datetime, timedelta

        cutoff = datetime.utcnow() - timedelta(days=days)
        return self.db.query(Patient).filter(
            Patient.created_at >= cutoff,
            Patient.is_deleted == False,
        ).order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()

    def get_today_registrations(self) -> List[Patient]:
        """Get patients registered today."""
        today = date.today()
        return self.db.query(Patient).filter(
            func.date(Patient.created_at) == today,
            Patient.is_deleted == False,
        ).order_by(Patient.created_at.desc()).all()

    def generate_mr_number(self) -> str:
        """Generate next MR number using sequence."""
        result = self.db.execute(text("SELECT nextval('mr_number_seq')"))
        seq_val = result.scalar()
        return f"MR-{seq_val:05d}"

    def phone_exists(self, phone: str, exclude_id: Optional[UUID] = None) -> bool:
        """Check if phone number already exists."""
        query = self.db.query(Patient.id).filter(
            Patient.phone == phone,
            Patient.is_deleted == False,
        )
        if exclude_id:
            query = query.filter(Patient.id != exclude_id)
        return query.first() is not None
