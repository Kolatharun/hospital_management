"""
Master Data Controller - API endpoints for master data search
"""

from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.services.master_data_service import MasterDataService
from app.schemas.master_data import ComplaintResponse, DiagnosisResponse, LabTestResponse, MedicineResponse

router = APIRouter(prefix="/master", tags=["Master Data"])


@router.get("/complaints/search", response_model=List[ComplaintResponse])
def search_complaints(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Search complaints by query string."""
    service = MasterDataService(db)
    return service.search_complaints(q, limit)


@router.get("/diagnosis/search", response_model=List[DiagnosisResponse])
def search_diagnosis(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Search diagnosis by query string."""
    service = MasterDataService(db)
    return service.search_diagnosis(q, limit)


@router.get("/lab-tests/search", response_model=List[LabTestResponse])
def search_lab_tests(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Search lab tests by query string."""
    service = MasterDataService(db)
    return service.search_lab_tests(q, limit)


@router.get("/medicines/search", response_model=List[MedicineResponse])
def search_medicines(
    q: str = Query(..., min_length=3, description="Search query (minimum 3 characters)"),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Search medicines by name, generic name, code, or category.
    Only returns active, non-deleted medicines.
    """
    service = MasterDataService(db)
    return service.search_medicines(q, limit)
