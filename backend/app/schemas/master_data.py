"""
Master Data Schemas
"""

from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class MasterDataBase(BaseModel):
    code: str
    category: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class ComplaintResponse(MasterDataBase):
    id: UUID
    complaint: str


class DiagnosisResponse(MasterDataBase):
    id: UUID
    diagnosis: str


class LabTestResponse(MasterDataBase):
    id: UUID
    test_name: str


class SearchQuery(BaseModel):
    q: str
    limit: Optional[int] = 10
