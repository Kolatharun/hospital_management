"""
Authentication Controller - Auth API Endpoints

Maps to frontend:
- LoginPage.tsx: POST /auth/login
- AuthContext.tsx: GET /auth/me, POST /auth/refresh

API Endpoints:
- POST /auth/login - User login
- POST /auth/refresh - Refresh access token
- GET /auth/me - Get current user info
- POST /auth/logout - Logout (client-side token removal)
- POST /auth/change-password - Change password
- POST /auth/users - Create user (admin)
- GET /auth/users/{id} - Get user by ID
- PATCH /auth/users/{id} - Update user
- POST /auth/users/{id}/deactivate - Deactivate user
- POST /auth/users/{id}/activate - Activate user
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import (
    get_current_user,
    get_current_active_user,
    require_any_role,
)
from app.models.user import User
from app.services.auth_service import AuthService
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    TokenResponse,
    RefreshTokenRequest,
    UserResponse,
    UserCreate,
    UserUpdate,
    PasswordChange,
)
from app.schemas.common import MessageResponse


router = APIRouter(prefix="/auth", tags=["Authentication"])


# Dependency for AuthService
def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    """Get AuthService instance with database session."""
    return AuthService(db)


@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    summary="User Login",
    description="""
    Authenticate user with username and password.

    **Frontend mapping:** LoginPage.tsx form submission

    Returns JWT access and refresh tokens along with user information.

    **Demo credentials:**
    - Front Office: username=`frontoffice`, password=`front123`
    - Doctor: username=`doctor`, password=`doctor123`
    """,
    responses={
        200: {"description": "Login successful"},
        401: {"description": "Invalid credentials"},
    },
)
async def login(
    login_data: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> LoginResponse:
    """
    Authenticate user and return tokens.

    - **username**: User's login username
    - **password**: User's password
    """
    return auth_service.authenticate_user(login_data)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh Access Token",
    description="""
    Get new access token using refresh token.

    Call this endpoint when the access token expires
    to get a fresh token without re-authenticating.
    """,
    responses={
        200: {"description": "Token refreshed successfully"},
        401: {"description": "Invalid or expired refresh token"},
    },
)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    """
    Refresh access token.

    - **refresh_token**: Valid refresh token from login
    """
    return auth_service.refresh_access_token(refresh_data.refresh_token)


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current User",
    description="""
    Get information about the currently authenticated user.

    **Frontend mapping:** AuthContext.tsx user state

    Requires valid access token in Authorization header.
    """,
    responses={
        200: {"description": "User information retrieved"},
        401: {"description": "Not authenticated"},
    },
)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
    auth_service: AuthService = Depends(get_auth_service),
) -> UserResponse:
    """
    Get current authenticated user's information.
    """
    return auth_service.get_current_user_info(current_user)


@router.post(
    "/logout",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Logout",
    description="""
    Logout the current user.

    **Note:** JWT tokens are stateless, so actual logout is handled
    client-side by removing the stored tokens. This endpoint is
    provided for consistency and can be used for audit logging.

    **Frontend mapping:** Header.tsx logout button
    """,
    responses={
        200: {"description": "Logout successful"},
    },
)
async def logout(
    current_user: User = Depends(get_current_active_user),
) -> MessageResponse:
    """
    Logout current user (client should discard tokens).
    """
    # In a stateful session system, we would invalidate the session here
    # For JWT, the client simply discards the token
    return MessageResponse(
        message=f"User {current_user.username} logged out successfully",
        success=True,
    )


@router.post(
    "/change-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Change Password",
    description="""
    Change the current user's password.

    Requires the current password for verification.
    """,
    responses={
        200: {"description": "Password changed successfully"},
        400: {"description": "Current password is incorrect"},
        401: {"description": "Not authenticated"},
    },
)
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    auth_service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    """
    Change password for current user.

    - **current_password**: Current password for verification
    - **new_password**: New password (min 6 characters)
    """
    auth_service.change_password(current_user, password_data)
    return MessageResponse(
        message="Password changed successfully",
        success=True,
    )


# ============================================================
# User Management Endpoints (Admin operations)
# ============================================================

@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create User",
    description="""
    Create a new user account.

    Used to create staff accounts for front office and doctors.
    """,
    responses={
        201: {"description": "User created successfully"},
        400: {"description": "Username or email already exists"},
        401: {"description": "Not authenticated"},
        403: {"description": "Not authorized"},
    },
)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_any_role),
    auth_service: AuthService = Depends(get_auth_service),
) -> UserResponse:
    """
    Create a new user.

    - **username**: Unique username for login
    - **password**: Password (min 6 characters)
    - **display_name**: Name displayed in UI
    - **email**: Optional email address
    - **role**: User role (front-office or doctor)
    """
    return auth_service.create_user(user_data)


@router.get(
    "/users/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get User by ID",
    description="Get user information by their ID.",
    responses={
        200: {"description": "User information retrieved"},
        401: {"description": "Not authenticated"},
        404: {"description": "User not found"},
    },
)
async def get_user(
    user_id: UUID,
    current_user: User = Depends(get_current_active_user),
    auth_service: AuthService = Depends(get_auth_service),
) -> UserResponse:
    """
    Get user by ID.
    """
    return auth_service.get_user_by_id(user_id)


@router.patch(
    "/users/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update User",
    description="Update user information.",
    responses={
        200: {"description": "User updated successfully"},
        400: {"description": "Email already exists"},
        401: {"description": "Not authenticated"},
        404: {"description": "User not found"},
    },
)
async def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    current_user: User = Depends(require_any_role),
    auth_service: AuthService = Depends(get_auth_service),
) -> UserResponse:
    """
    Update user information.

    - **display_name**: Updated display name
    - **email**: Updated email address
    - **is_active**: Account active status
    """
    return auth_service.update_user(user_id, user_data)


@router.post(
    "/users/{user_id}/deactivate",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Deactivate User",
    description="Deactivate a user account. Prevents login.",
    responses={
        200: {"description": "User deactivated"},
        401: {"description": "Not authenticated"},
        404: {"description": "User not found"},
    },
)
async def deactivate_user(
    user_id: UUID,
    current_user: User = Depends(require_any_role),
    auth_service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    """
    Deactivate a user account.
    """
    auth_service.deactivate_user(user_id)
    return MessageResponse(
        message="User deactivated successfully",
        success=True,
    )


@router.post(
    "/users/{user_id}/activate",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Activate User",
    description="Activate a deactivated user account.",
    responses={
        200: {"description": "User activated"},
        401: {"description": "Not authenticated"},
        404: {"description": "User not found"},
    },
)
async def activate_user(
    user_id: UUID,
    current_user: User = Depends(require_any_role),
    auth_service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    """
    Activate a user account.
    """
    auth_service.activate_user(user_id)
    return MessageResponse(
        message="User activated successfully",
        success=True,
    )
