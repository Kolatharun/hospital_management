"""
Document Service - Patient document business logic
"""

import os
import uuid
from datetime import date
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile

from app.repositories.document_repository import DocumentRepository
from app.repositories.patient_repository import PatientRepository
from app.models.document import PatientDocument
from app.models.user import User
from app.schemas.document import (
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
)

# Configure upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "documents")


class DocumentService:
    """Service for patient document operations."""

    def __init__(self, db: Session):
        self.db = db
        self.doc_repo = DocumentRepository(db)
        self.patient_repo = PatientRepository(db)

    def _ensure_upload_dir(self):
        """Ensure upload directory exists."""
        os.makedirs(UPLOAD_DIR, exist_ok=True)

    def upload_document(
        self,
        data: DocumentCreate,
        current_user: User,
    ) -> PatientDocument:
        """Create a document record."""
        # Verify patient exists
        patient = self.patient_repo.get_by_id(data.patient_id)
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found",
            )

        doc_data = {
            "patient_id": data.patient_id,
            "appointment_id": data.appointment_id,
            "uploaded_by": current_user.id,
            "file_name": data.file_name,
            "file_path": data.file_path,
            "file_type": data.file_type,
            "file_size": data.file_size,
            "document_type": data.document_type,
            "description": data.description,
        }

        document = self.doc_repo.create(doc_data)
        return document

    async def upload_file(
        self,
        file: UploadFile,
        patient_id: UUID,
        document_type: str,
        current_user: User,
        appointment_id: Optional[UUID] = None,
        description: Optional[str] = None,
    ) -> PatientDocument:
        """Upload a file and create document record."""
        self._ensure_upload_dir()

        # Verify patient exists
        patient = self.patient_repo.get_by_id(patient_id)
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found",
            )

        # Generate unique filename
        ext = os.path.splitext(file.filename)[1] if file.filename else ""
        unique_name = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)

        # Save file
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        # Create document record
        doc_data = {
            "patient_id": patient_id,
            "appointment_id": appointment_id,
            "uploaded_by": current_user.id,
            "file_name": file.filename or unique_name,
            "file_path": file_path,
            "file_type": file.content_type or "application/octet-stream",
            "file_size": len(contents),
            "document_type": document_type,
            "description": description,
        }

        document = self.doc_repo.create(doc_data)
        return document

    def get_document(self, document_id: UUID) -> PatientDocument:
        """Get document by ID."""
        document = self.doc_repo.get_by_id(document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )
        return document

    def get_patient_documents(
        self,
        patient_id: UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple:
        """Get documents for a patient. Returns (documents, total)."""
        documents = self.doc_repo.get_by_patient(patient_id, skip, limit)
        total = self.doc_repo.count_by_patient(patient_id)
        return documents, total

    def get_appointment_documents(
        self,
        appointment_id: UUID,
    ) -> List[PatientDocument]:
        """Get documents for an appointment."""
        return self.doc_repo.get_by_appointment(appointment_id)

    def get_today_uploads(self) -> List[PatientDocument]:
        """Get all documents uploaded today."""
        return self.doc_repo.get_today_uploads()

    def update_document(
        self,
        document_id: UUID,
        data: DocumentUpdate,
    ) -> PatientDocument:
        """Update document metadata."""
        document = self.get_document(document_id)

        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        if not update_dict:
            return document

        updated = self.doc_repo.update(document_id, update_dict)
        return updated

    def delete_document(self, document_id: UUID) -> None:
        """Delete a document (soft delete)."""
        document = self.get_document(document_id)
        self.doc_repo.delete(document_id, soft=True)

    def build_response(self, document: PatientDocument) -> DocumentResponse:
        """Build document response with additional data."""
        patient_name = None
        patient_mr = None
        uploader_name = None

        if document.patient:
            patient_name = document.patient.full_name
            patient_mr = document.patient.mr_number

        if document.uploader:
            uploader_name = document.uploader.display_name

        return DocumentResponse(
            id=document.id,
            patient_id=document.patient_id,
            appointment_id=document.appointment_id,
            uploaded_by=document.uploaded_by,
            file_name=document.file_name,
            file_path=document.file_path,
            file_type=document.file_type,
            file_size=document.file_size,
            file_size_formatted=document.file_size_formatted,
            document_type=document.document_type,
            description=document.description,
            patient_name=patient_name,
            patient_mr_number=patient_mr,
            uploaded_by_name=uploader_name,
            created_at=document.created_at.isoformat() if document.created_at else None,
            updated_at=document.updated_at.isoformat() if document.updated_at else None,
        )
