"""
Master Data Repositories
"""

from typing import List, TypeVar, Type
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository, ModelType
from app.models.master_data import ComplaintMaster, DiagnosisMaster, LabTestMaster
from app.models.medicine import MedicineMaster


class ComplaintRepository(BaseRepository[ComplaintMaster]):
    def __init__(self, db: Session):
        super().__init__(ComplaintMaster, db)

    def search(self, query: str, limit: int = 20) -> List[ComplaintMaster]:
        search_pattern = f"%{query}%"
        return self.db.query(self.model).filter(
            self.model.is_deleted == False,
            or_(
                ComplaintMaster.complaint.ilike(search_pattern),
                ComplaintMaster.code.ilike(search_pattern),
                ComplaintMaster.category.ilike(search_pattern)
            )
        ).limit(limit).all()


class DiagnosisRepository(BaseRepository[DiagnosisMaster]):
    def __init__(self, db: Session):
        super().__init__(DiagnosisMaster, db)

    def search(self, query: str, limit: int = 20) -> List[DiagnosisMaster]:
        search_pattern = f"%{query}%"
        return self.db.query(self.model).filter(
            self.model.is_deleted == False,
            or_(
                DiagnosisMaster.diagnosis.ilike(search_pattern),
                DiagnosisMaster.code.ilike(search_pattern),
                DiagnosisMaster.category.ilike(search_pattern)
            )
        ).limit(limit).all()


class LabTestRepository(BaseRepository[LabTestMaster]):
    def __init__(self, db: Session):
        super().__init__(LabTestMaster, db)

    def search(self, query: str, limit: int = 20) -> List[LabTestMaster]:
        search_pattern = f"%{query}%"
        return self.db.query(self.model).filter(
            self.model.is_deleted == False,
            or_(
                LabTestMaster.test_name.ilike(search_pattern),
                LabTestMaster.code.ilike(search_pattern),
                LabTestMaster.category.ilike(search_pattern)
            )
        ).limit(limit).all()


class MedicineRepository(BaseRepository[MedicineMaster]):
    """Repository for medicine master data with search functionality."""

    def __init__(self, db: Session):
        super().__init__(MedicineMaster, db)

    def search(self, query: str, limit: int = 20) -> List[MedicineMaster]:
        """
        Search medicines by name, generic_name, code, or category.
        Only returns active, non-deleted medicines.
        """
        search_pattern = f"%{query}%"
        return self.db.query(self.model).filter(
            and_(
                self.model.is_deleted == False,
                self.model.is_active == True,
                or_(
                    MedicineMaster.name.ilike(search_pattern),
                    MedicineMaster.generic_name.ilike(search_pattern),
                    MedicineMaster.code.ilike(search_pattern),
                    MedicineMaster.category.ilike(search_pattern)
                )
            )
        ).limit(limit).all()
