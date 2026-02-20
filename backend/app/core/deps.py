"""
Dependency Injection Module - Authentication and Authorization Dependencies

Provides FastAPI dependencies for:
- Current user extraction from JWT
- Role-based access control
- Permission checking

Derived from frontend:
- AuthContext.tsx: User roles (front-office, doctor)
- ProtectedRoute: Route access control
- Header.tsx: Role-based UI elements
"""

from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole
from app.models.doctor import Doctor


# HTTP Bearer token security scheme
security = HTTPBearer(
    scheme_name="JWT",
    description="Enter your JWT token",
    auto_error=True,
)

# Optional bearer for endpoints that work with or without auth
optional_security = HTTPBearer(
    scheme_name="JWT",
    description="Optional JWT token",
    auto_error=False,
)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Get the current authenticated user from JWT token.

    Validates the token and returns the corresponding User object.
    Used as a dependency in protected routes.

    Args:
        credentials: Bearer token from Authorization header
        db: Database session

    Returns:
        User object for the authenticated user

    Raises:
        HTTPException 401: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        raise credentials_exception

    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    # Check token type
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()

    if user is None:
        raise credentials_exception

    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Optionally get the current user if token is provided.

    Used for endpoints that work differently based on authentication status.

    Args:
        credentials: Optional bearer token
        db: Database session

    Returns:
        User object if authenticated, None otherwise
    """
    if credentials is None:
        return None

    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Ensure the current user is active.

    Args:
        current_user: The authenticated user

    Returns:
        The user if active

    Raises:
        HTTPException 403: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    return current_user


class RoleChecker:
    """
    Role-based access control dependency.

    Usage:
        @router.get("/admin-only")
        def admin_endpoint(user: User = Depends(RoleChecker([UserRole.DOCTOR]))):
            ...

    Derived from frontend role checks:
    - FrontOfficeDashboard.tsx: front-office role access
    - DoctorDashboard.tsx: doctor role access
    """

    def __init__(self, allowed_roles: List[UserRole]):
        """
        Initialize role checker with allowed roles.

        Args:
            allowed_roles: List of roles that can access the endpoint
        """
        self.allowed_roles = allowed_roles

    async def __call__(
        self,
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        """
        Check if current user has an allowed role.

        Args:
            current_user: The authenticated active user

        Returns:
            The user if role is allowed

        Raises:
            HTTPException 403: If user's role is not in allowed_roles
        """
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in self.allowed_roles]}",
            )
        return current_user


# Pre-configured role checkers for common use cases
require_admin = RoleChecker([UserRole.ADMIN])
require_front_office = RoleChecker([UserRole.FRONT_OFFICE])
require_doctor = RoleChecker([UserRole.DOCTOR])
require_any_role = RoleChecker([UserRole.FRONT_OFFICE, UserRole.DOCTOR])
require_any_clinical = RoleChecker([UserRole.ADMIN, UserRole.FRONT_OFFICE, UserRole.DOCTOR])


def get_admin_user(
    current_user: User = Depends(require_admin),
) -> User:
    """
    Dependency for admin only endpoints.

    Maps to: AdminDashboard.tsx screens
    - User Management
    - Doctor Management
    - Medicine Management
    - System Settings
    """
    return current_user


def get_front_office_user(
    current_user: User = Depends(require_front_office),
) -> User:
    """
    Dependency for front office only endpoints.

    Maps to: FrontOfficeDashboard.tsx screens
    - Patient Registration
    - Billing
    - Vitals Collection
    - Queue Management
    """
    return current_user


def get_doctor_user(
    current_user: User = Depends(require_doctor),
) -> User:
    """
    Dependency for doctor only endpoints.

    Maps to: DoctorDashboard.tsx screens
    - Prescription Form
    - Patient Queue
    - Patient History
    """
    return current_user


def get_clinical_user(
    current_user: User = Depends(require_any_role),
) -> User:
    """
    Dependency for endpoints accessible by any clinical staff.

    Maps to: Shared functionality
    - Patient Search
    - View History
    """
    return current_user


def require_roles(roles: List[UserRole]):
    """
    Factory function to create role checker dependency.

    Usage:
        @router.get("/endpoint")
        def endpoint(user: User = Depends(require_roles([UserRole.DOCTOR]))):
            ...
    """
    return RoleChecker(roles)


async def get_current_doctor(
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db),
) -> Doctor:
    """
    Get the Doctor record for the current authenticated doctor user.

    Maps to: DoctorDashboard.tsx
    - Prescription creation
    - Patient queue management
    - Consultation workflows

    Args:
        current_user: The authenticated doctor user
        db: Database session

    Returns:
        Doctor object linked to the user

    Raises:
        HTTPException 403: If no doctor record found for user (profile not linked)
    """
    doctor = db.query(Doctor).filter(
        Doctor.user_id == current_user.id,
        Doctor.is_deleted == False,
    ).first()

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor profile not linked. Please contact admin.",
        )

    return doctor
