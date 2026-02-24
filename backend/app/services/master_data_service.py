"""
Master Data Service
"""

from typing import List
from sqlalchemy.orm import Session
from app.repositories.master_data_repository import (
    ComplaintRepository,
    DiagnosisRepository,
    LabTestRepository,
    MedicineRepository,
)
from app.models.master_data import ComplaintMaster, DiagnosisMaster, LabTestMaster
from app.models.medicine import MedicineMaster


class MasterDataService:
    def __init__(self, db: Session):
        self.db = db
        self.complaint_repo = ComplaintRepository(db)
        self.diagnosis_repo = DiagnosisRepository(db)
        self.labtest_repo = LabTestRepository(db)
        self.medicine_repo = MedicineRepository(db)

    def search_complaints(self, query: str, limit: int = 20) -> List[ComplaintMaster]:
        if not query:
            return []
        return self.complaint_repo.search(query, limit)

    def search_diagnosis(self, query: str, limit: int = 20) -> List[DiagnosisMaster]:
        if not query:
            return []
        return self.diagnosis_repo.search(query, limit)

    def search_lab_tests(self, query: str, limit: int = 20) -> List[LabTestMaster]:
        if not query:
            return []
        return self.labtest_repo.search(query, limit)

    def search_medicines(self, query: str, limit: int = 20) -> List[MedicineMaster]:
        """Search medicines by name, generic name, code, or category."""
        if not query:
            return []
        return self.medicine_repo.search(query, limit)
