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
        """
        Generate next MR number using PostgreSQL sequence.

        Uses database sequence for:
        - Guaranteed uniqueness under concurrent access
        - No gaps under normal operation
        - Atomic increment operation

        Returns:
            str: Formatted MR number (e.g., "MR-00001")

        Raises:
            SQLAlchemyError: If sequence doesn't exist or DB error occurs
        """
        result = self.db.execute(text("SELECT nextval('mr_number_seq')"))
        seq_val = result.scalar()
        return f"MR-{seq_val:05d}"

    def get_current_mr_sequence_value(self) -> int:
        """
        Get current sequence value without incrementing.

        Useful for admin dashboards to show next MR number.

        Returns:
            int: Current sequence value (next MR will be this + 1)
        """
        result = self.db.execute(text("SELECT last_value FROM mr_number_seq"))
        return result.scalar() or 0

    def reset_mr_sequence(self, start_value: int = 1) -> None:
        """
        Reset MR sequence to a specific value.

        WARNING: Only use during initial setup or data migration.
        Should NOT be used in production with existing patients.

        Args:
            start_value: Value to restart the sequence from
        """
        self.db.execute(text(f"ALTER SEQUENCE mr_number_seq RESTART WITH {start_value}"))
        self.db.commit()

    def phone_exists(self, phone: str, exclude_id: Optional[UUID] = None) -> bool:
        """Check if phone number already exists."""
        query = self.db.query(Patient.id).filter(
            Patient.phone == phone,
            Patient.is_deleted == False,
        )
        if exclude_id:
            query = query.filter(Patient.id != exclude_id)
        return query.first() is not None
