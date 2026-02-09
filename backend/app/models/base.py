"""
Base Model Classes and Mixins

Provides common functionality for all models:
- UUID primary keys
- Timestamp tracking (created_at, updated_at)
- Soft delete support
"""

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Column, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class BaseModel(Base):
    """
    Abstract base model with UUID primary key and common fields.

    All entity models should inherit from this class.
    Includes:
    - UUID primary key
    - created_at, updated_at timestamps
    - Soft delete support (is_deleted, deleted_at)
    """

    __abstract__ = True
    __allow_unmapped__ = True  # Allow legacy column definitions

    # Primary key
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    # Timestamp fields
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Soft delete fields
    is_deleted = Column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )

    deleted_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    def soft_delete(self) -> None:
        """Mark this record as deleted."""
        self.is_deleted = True
        self.deleted_at = datetime.now(timezone.utc)

    def restore(self) -> None:
        """Restore a soft-deleted record."""
        self.is_deleted = False
        self.deleted_at = None

    def to_dict(self) -> dict[str, Any]:
        """Convert model to dictionary."""
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # Handle UUID serialization
            if isinstance(value, uuid.UUID):
                value = str(value)
            # Handle datetime serialization
            elif isinstance(value, datetime):
                value = value.isoformat()
            result[column.name] = value
        return result

    def __repr__(self) -> str:
        """String representation showing class name and ID."""
        return f"<{self.__class__.__name__}(id={self.id})>"
