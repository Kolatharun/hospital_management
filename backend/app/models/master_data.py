"""
Master Data Models - Complaints, Diagnosis, and Lab Tests
"""

from sqlalchemy import Column, String, Index
from app.models.base import BaseModel


class ComplaintMaster(BaseModel):
    """
    Master data for OP Complaints.
    Derived from op_complaints_master.csv.
    """
    __tablename__ = "op_complaints_master"

    code = Column(
        String(50), 
        nullable=False, 
        unique=True, 
        index=True,
        comment="Unique complaint code"
    )
    category = Column(
        String(100), 
        nullable=True, 
        index=True,
        comment="Broad category of the complaint"
    )
    complaint = Column(
        String(255), 
        nullable=False, 
        index=True,
        comment="The complaint description"
    )

    def __repr__(self) -> str:
        return f"<ComplaintMaster(code={self.code}, complaint={self.complaint})>"


class DiagnosisMaster(BaseModel):
    """
    Master data for OP Diagnosis.
    Derived from op_diagnosis_master.csv.
    """
    __tablename__ = "op_diagnosis_master"

    code = Column(
        String(50), 
        nullable=False, 
        unique=True, 
        index=True,
        comment="Unique diagnosis code"
    )
    category = Column(
        String(100), 
        nullable=True, 
        index=True,
        comment="Broad category of the diagnosis"
    )
    diagnosis = Column(
        String(255), 
        nullable=False, 
        index=True,
        comment="The diagnosis description"
    )

    def __repr__(self) -> str:
        return f"<DiagnosisMaster(code={self.code}, diagnosis={self.diagnosis})>"


class LabTestMaster(BaseModel):
    """
    Master data for OP Lab Tests.
    Derived from op_labtests_master.csv.
    """
    __tablename__ = "op_labtests_master"

    code = Column(
        String(50), 
        nullable=False, 
        unique=True, 
        index=True,
        comment="Unique lab test code"
    )
    category = Column(
        String(100), 
        nullable=True, 
        index=True,
        comment="Broad category of the lab test"
    )
    test_name = Column(
        String(255), 
        nullable=False, 
        index=True,
        comment="The lab test name"
    )

    def __repr__(self) -> str:
        return f"<LabTestMaster(code={self.code}, test_name={self.test_name})>"


# Indexes for efficient search (already handled by index=True in Column)
