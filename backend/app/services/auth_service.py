"""
Authentication Service - Business Logic for Auth Operations

Handles all authentication-related business logic:
- User login/logout
- Token generation and refresh
- Password management
- User CRUD operations

Derived from frontend:
- LoginPage.tsx: Login flow
- AuthContext.tsx: Session management
"""

from typing import Optional, Tuple
from datetime import timedelta
from uuid import UUID

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.repositories.user_repository import UserRepository
from app.models.user import User, UserRole
from app.models.doctor import Doctor
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    TokenResponse,
    UserResponse,
    UserCreate,
    UserUpdate,
    PasswordChange,
)


class AuthService:
    """
    Authentication service handling all auth-related operations.
    """

    def __init__(self, db: Session):
        """
        Initialize service with database session.

        Args:
            db: SQLAlchemy database session
        """
        self.db = db
        self.user_repo = UserRepository(db)

    def authenticate_user(
        self,
        login_data: LoginRequest,
    ) -> LoginResponse:
        """
        Authenticate user with username and password.

        Maps to frontend: LoginPage.tsx form submission

        Args:
            login_data: Login credentials

        Returns:
            LoginResponse with tokens and user info

        Raises:
            HTTPException 401: If credentials are invalid
        """
        # Find user by username
        user = self.user_repo.get_by_username(login_data.username)

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Verify password
        if not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check if account is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Update last login
        self.user_repo.update_last_login(user.id)

        # Generate tokens
        tokens = self._generate_tokens(user)

        # Build response
        user_response = self._build_user_response(user)

        return LoginResponse(
            tokens=tokens,
            user=user_response,
        )

    def refresh_access_token(self, refresh_token: str) -> TokenResponse:
        """
        Generate new access token using refresh token.

        Args:
            refresh_token: Valid refresh token

        Returns:
            New TokenResponse with fresh access token

        Raises:
            HTTPException 401: If refresh token is invalid
        """
        # Decode refresh token
        payload = decode_token(refresh_token)

        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Verify token type
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Get user
        user_id = payload.get("sub")
        user = self.user_repo.get_by_id(UUID(user_id))

        if user is None or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Generate new tokens
        return self._generate_tokens(user)

    def get_current_user_info(self, user: User) -> UserResponse:
        """
        Get current user information.

        Maps to frontend: AuthContext.tsx user state

        Args:
            user: Current authenticated user

        Returns:
            UserResponse with user information
        """
        return self._build_user_response(user)

    def create_user(self, user_data: UserCreate) -> UserResponse:
        """
        Create a new user account.

        Used to create staff accounts.

        Args:
            user_data: User creation data

        Returns:
            Created user information

        Raises:
            HTTPException 400: If username already exists
        """
        # Check if username exists
        if self.user_repo.username_exists(user_data.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists",
            )

        # Check if email exists (if provided)
        if user_data.email and self.user_repo.email_exists(user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists",
            )

        # Hash password
        password_hash = get_password_hash(user_data.password)

        # Create user
        user_dict = {
            "username": user_data.username,
            "password_hash": password_hash,
            "display_name": user_data.display_name,
            "email": user_data.email,
            "role": UserRole(user_data.role),
            "is_active": True,
        }

        user = self.user_repo.create(user_dict)

        return self._build_user_response(user)

    def update_user(
        self,
        user_id: UUID,
        user_data: UserUpdate,
    ) -> UserResponse:
        """
        Update user information.

        Args:
            user_id: User ID to update
            user_data: Fields to update

        Returns:
            Updated user information

        Raises:
            HTTPException 404: If user not found
            HTTPException 400: If email already exists
        """
        # Check user exists
        user = self.user_repo.get_by_id(user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # Check email uniqueness if being updated
        if user_data.email and self.user_repo.email_exists(
            user_data.email, exclude_user_id=user_id
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists",
            )

        # Build update dict (only non-None values)
        update_dict = {
            k: v for k, v in user_data.model_dump().items()
            if v is not None
        }

        if not update_dict:
            return self._build_user_response(user)

        # Update user
        updated_user = self.user_repo.update(user_id, update_dict)

        return self._build_user_response(updated_user)

    def change_password(
        self,
        user: User,
        password_data: PasswordChange,
    ) -> bool:
        """
        Change user's password.

        Args:
            user: Current user
            password_data: Current and new password

        Returns:
            True if password changed successfully

        Raises:
            HTTPException 400: If current password is incorrect
        """
        # Verify current password
        if not verify_password(password_data.current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )

        # Hash new password
        new_hash = get_password_hash(password_data.new_password)

        # Update password
        self.user_repo.update_password(user.id, new_hash)

        return True

    def deactivate_user(self, user_id: UUID) -> bool:
        """
        Deactivate a user account.

        Args:
            user_id: User ID to deactivate

        Returns:
            True if deactivated successfully

        Raises:
            HTTPException 404: If user not found
        """
        user = self.user_repo.deactivate_user(user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return True

    def activate_user(self, user_id: UUID) -> bool:
        """
        Activate a user account.

        Args:
            user_id: User ID to activate

        Returns:
            True if activated successfully

        Raises:
            HTTPException 404: If user not found
        """
        user = self.user_repo.activate_user(user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return True

    def get_user_by_id(self, user_id: UUID) -> UserResponse:
        """
        Get user by ID.

        Args:
            user_id: User ID

        Returns:
            User information

        Raises:
            HTTPException 404: If user not found
        """
        user = self.user_repo.get_by_id(user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return self._build_user_response(user)

    def _generate_tokens(self, user: User) -> TokenResponse:
        """
        Generate access and refresh tokens for a user.

        Args:
            user: User to generate tokens for

        Returns:
            TokenResponse with both tokens
        """
        # Token payload - matches frontend expectations
        token_data = {
            "sub": str(user.id),
            "username": user.username,
            "role": user.role.value,
            "name": user.display_name,
        }

        # Add doctor_id if user is a doctor
        if user.is_doctor:
            doctor = self.db.query(Doctor).filter(
                Doctor.user_id == user.id,
                Doctor.is_deleted == False
            ).first()
            if doctor:
                token_data["doctor_id"] = str(doctor.id)

        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token({"sub": str(user.id)})

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert to seconds
        )

    def _build_user_response(self, user: User) -> UserResponse:
        """
        Build UserResponse from User model.

        Maps to frontend AuthContext.tsx user state.

        Args:
            user: User model instance

        Returns:
            UserResponse schema
        """
        # Get doctor_id if user is a doctor
        doctor_id = None
        if user.is_doctor:
            doctor = self.db.query(Doctor).filter(
                Doctor.user_id == user.id,
                Doctor.is_deleted == False
            ).first()
            if doctor:
                doctor_id = doctor.id

        return UserResponse(
            id=user.id,
            username=user.username,
            display_name=user.display_name,
            email=user.email,
            role=user.role.value,
            is_active=user.is_active,
            last_login=user.last_login,
            doctor_id=doctor_id,
        )
