"""
Master Data Repositories
"""

from typing import List, TypeVar, Type
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository, ModelType
from app.models.master_data import ComplaintMaster, DiagnosisMaster, LabTestMaster


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
