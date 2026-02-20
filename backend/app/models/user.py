"""
User Model - Authentication and Authorization

Derived from frontend analysis:
- LoginPage.tsx: Username/password fields, role-based quick login
- AuthContext.tsx: User roles ('front-office', 'doctor')
- Header.tsx: Display name, role badge

Database Fields:
- id: UUID primary key
- username: Unique login identifier
- password_hash: Bcrypt hashed password
- display_name: Name shown in UI (Header.tsx)
- role: User role enum (front-office, doctor)
- is_active: Account status
- last_login: Audit tracking
"""

import enum
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, String, Boolean, DateTime, Enum, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class UserRole(str, enum.Enum):
    """
    User roles derived from frontend LoginPage.tsx.

    Quick login buttons show two distinct roles:
    - Admin: Full system access, user management, settings
    - Front Office: Access to registration, billing, vitals, queue
    - Doctor: Access to prescriptions, consultations, patient history
    """

    ADMIN = "admin"
    FRONT_OFFICE = "front-office"
    DOCTOR = "doctor"


class User(BaseModel):
    """
    User account model for authentication.

    Stores credentials and role information for all system users.
    """

    __tablename__ = "users"

    # Authentication fields
    username = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
        comment="Unique login identifier",
    )

    password_hash = Column(
        String(255),
        nullable=False,
        comment="Bcrypt hashed password",
    )

    # Profile fields (from Header.tsx display)
    display_name = Column(
        String(200),
        nullable=False,
        comment="Name displayed in UI header",
    )

    email = Column(
        String(255),
        nullable=True,
        unique=True,
        index=True,
        comment="Optional email for notifications",
    )

    # Role and access control
    role = Column(
        Enum(UserRole, name="user_role", native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
        comment="User role determining access permissions",
    )

    # Account status
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
        comment="Whether account is active and can login",
    )

    # Audit fields
    last_login = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp of last successful login",
    )

    # Relationship to Doctor (if user is a doctor)
    # Will be added in Phase 2 when Doctor model is created
    # doctor = relationship("Doctor", back_populates="user", uselist=False)

    # Table indexes for common queries
    __table_args__ = (
        Index("ix_users_username_active", "username", "is_active"),
        Index("ix_users_role_active", "role", "is_active"),
    )

    def update_last_login(self) -> None:
        """Update the last_login timestamp to now."""
        self.last_login = datetime.now(timezone.utc)

    @property
    def is_admin(self) -> bool:
        """Check if user has admin role."""
        return self.role == UserRole.ADMIN

    @property
    def is_doctor(self) -> bool:
        """Check if user has doctor role."""
        return self.role == UserRole.DOCTOR

    @property
    def is_front_office(self) -> bool:
        """Check if user has front office role."""
        return self.role == UserRole.FRONT_OFFICE

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username={self.username}, role={self.role.value})>"
