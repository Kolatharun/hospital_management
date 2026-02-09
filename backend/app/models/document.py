"""
PatientDocument Model - Patient Document Storage

Derived from frontend analysis:
- DocumentUpload.tsx: File upload component
- PatientSearch.tsx: Document list in patient history
"""

from typing import TYPE_CHECKING

from sqlalchemy import Column, String, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.patient import Patient
    from app.models.appointment import Appointment
    from app.models.user import User


class PatientDocument(BaseModel):
    """
    Patient document/file record.

    Stores metadata about uploaded documents.
    Actual files stored in filesystem or object storage.
    """

    __tablename__ = "patient_documents"

    # Links
    patient_id = Column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Link to patient",
    )

    appointment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("appointments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Optional link to appointment",
    )

    uploaded_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="User who uploaded the document",
    )

    # File metadata
    file_name = Column(
        String(255),
        nullable=False,
        comment="Original file name",
    )

    file_path = Column(
        String(500),
        nullable=False,
        comment="Storage path or URL",
    )

    file_type = Column(
        String(100),
        nullable=False,
        comment="MIME type",
    )

    file_size = Column(
        Integer,
        nullable=False,
        comment="File size in bytes",
    )

    # Document categorization
    document_type = Column(
        String(100),
        nullable=True,
        comment="Document category (lab report, prescription, etc.)",
    )

    description = Column(
        Text,
        nullable=True,
        comment="Document description",
    )

    # Relationships
    patient = relationship(
        "Patient",
        backref="documents",
        foreign_keys=[patient_id],
    )

    appointment = relationship(
        "Appointment",
        backref="documents",
        foreign_keys=[appointment_id],
    )

    uploader = relationship(
        "User",
        backref="uploaded_documents",
        foreign_keys=[uploaded_by],
    )

    @property
    def file_size_formatted(self) -> str:
        """Get human-readable file size."""
        size = self.file_size
        for unit in ["B", "KB", "MB", "GB"]:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"

    def __repr__(self) -> str:
        return f"<PatientDocument(id={self.id}, name={self.file_name})>"
