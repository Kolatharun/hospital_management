"""
Document Controller - Patient document upload endpoints
"""

import os
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.core.security import decode_token
from app.models.user import User, UserRole
from app.services.document_service import DocumentService
from app.schemas.document import (
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
    DocumentListResponse,
    TodayDocumentsResponse,
)

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("", response_model=DocumentResponse)
def create_document(
    data: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Create a document record (for pre-uploaded files)."""
    service = DocumentService(db)
    document = service.upload_document(data, current_user)
    return service.build_response(document)


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    patient_id: UUID = Form(...),
    document_type: str = Form(...),
    appointment_id: Optional[UUID] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Upload a document file for a patient."""
    service = DocumentService(db)
    document = await service.upload_file(
        file=file,
        patient_id=patient_id,
        document_type=document_type,
        current_user=current_user,
        appointment_id=appointment_id,
        description=description,
    )
    return service.build_response(document)


@router.get("/today", response_model=TodayDocumentsResponse)
def get_today_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all documents uploaded today."""
    service = DocumentService(db)
    documents = service.get_today_uploads()
    return TodayDocumentsResponse(
        items=[service.build_response(d) for d in documents],
        total=len(documents),
    )


@router.get("/patient/{patient_id}", response_model=DocumentListResponse)
def get_patient_documents(
    patient_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all documents for a patient."""
    service = DocumentService(db)
    documents, total = service.get_patient_documents(patient_id, skip, limit)
    return DocumentListResponse(
        items=[service.build_response(d) for d in documents],
        total=total,
    )


@router.get("/appointment/{appointment_id}", response_model=list[DocumentResponse])
def get_appointment_documents(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all documents for an appointment."""
    service = DocumentService(db)
    documents = service.get_appointment_documents(appointment_id)
    return [service.build_response(d) for d in documents]


@router.get("/{document_id}/file")
def get_document_file(
    document_id: UUID,
    token: Optional[str] = Query(None),
    download: bool = Query(False),
    db: Session = Depends(get_db),
):
    """Serve the actual document file for viewing/download.

    Accepts JWT token via query parameter to support <img> and <iframe> tags
    that cannot send Authorization headers.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    service = DocumentService(db)
    document = service.get_document(document_id)

    if not document.file_path or not os.path.isfile(document.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document file not found on server",
        )

    disposition = "attachment" if download else "inline"
    return FileResponse(
        path=document.file_path,
        media_type=document.file_type or "application/octet-stream",
        headers={"Content-Disposition": disposition}
    )


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get document by ID."""
    service = DocumentService(db)
    document = service.get_document(document_id)
    return service.build_response(document)


@router.put("/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: UUID,
    data: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Update document metadata."""
    service = DocumentService(db)
    document = service.update_document(document_id, data)
    return service.build_response(document)


@router.delete("/{document_id}")
def delete_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FRONT_OFFICE])),
):
    """Delete a document."""
    service = DocumentService(db)
    service.delete_document(document_id)
    return {"message": "Document deleted successfully"}
