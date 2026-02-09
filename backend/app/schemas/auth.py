"""
Authentication Schemas - Login, Token, and User Management

Derived from frontend analysis:
- LoginPage.tsx: Username/password login form
- AuthContext.tsx: Token storage, user state management
- Header.tsx: User display (name, role)

Request schemas match frontend form submissions.
Response schemas match frontend state expectations.
"""

from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr, field_validator
import re


class LoginRequest(BaseModel):
    """
    Login request matching frontend LoginPage.tsx form.

    Frontend sends:
    - username: string (required)
    - password: string (required)
    """

    username: str = Field(
        ...,
        min_length=3,
        max_length=100,
        description="Username for authentication",
        examples=["frontoffice", "doctor"],
    )

    password: str = Field(
        ...,
        min_length=4,
        max_length=100,
        description="Password for authentication",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "username": "frontoffice",
                "password": "front123",
            }
        }


class TokenResponse(BaseModel):
    """
    JWT token response structure.

    Returned after successful login.
    Frontend stores these tokens for subsequent requests.
    """

    access_token: str = Field(
        ...,
        description="JWT access token for API authentication",
    )

    refresh_token: str = Field(
        ...,
        description="JWT refresh token for obtaining new access tokens",
    )

    token_type: str = Field(
        default="bearer",
        description="Token type (always 'bearer')",
    )

    expires_in: int = Field(
        ...,
        description="Access token expiration time in seconds",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 28800,
            }
        }


class UserResponse(BaseModel):
    """
    User information response.

    Matches frontend AuthContext.tsx user state:
    - isAuthenticated: boolean
    - role: 'front-office' | 'doctor'
    - name: string

    Also used in Header.tsx for display.
    """

    id: UUID = Field(..., description="User unique identifier")

    username: str = Field(..., description="Username")

    display_name: str = Field(
        ...,
        description="Display name shown in UI",
    )

    email: Optional[str] = Field(
        None,
        description="User email address",
    )

    role: str = Field(
        ...,
        description="User role (front-office or doctor)",
    )

    is_active: bool = Field(
        ...,
        description="Whether the account is active",
    )

    last_login: Optional[datetime] = Field(
        None,
        description="Last login timestamp",
    )

    # Optional: If user is a doctor, include doctor_id
    doctor_id: Optional[UUID] = Field(
        None,
        description="Associated doctor ID (if role is doctor)",
    )

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "username": "doctor",
                "display_name": "Dr. R. Balaji",
                "email": "dr.balaji@example.com",
                "role": "doctor",
                "is_active": True,
                "last_login": "2024-01-15T10:30:00Z",
                "doctor_id": "660e8400-e29b-41d4-a716-446655440001",
            }
        }


class LoginResponse(BaseModel):
    """
    Complete login response combining tokens and user info.

    This matches the frontend's expected login response:
    - Tokens for authentication
    - User info for UI state
    """

    tokens: TokenResponse = Field(
        ...,
        description="JWT tokens",
    )

    user: UserResponse = Field(
        ...,
        description="User information",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "tokens": {
                    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "token_type": "bearer",
                    "expires_in": 28800,
                },
                "user": {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "username": "frontoffice",
                    "display_name": "Front Office Staff",
                    "role": "front-office",
                    "is_active": True,
                },
            }
        }


class RefreshTokenRequest(BaseModel):
    """
    Request to refresh access token using refresh token.
    """

    refresh_token: str = Field(
        ...,
        description="Valid refresh token",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            }
        }


class UserCreate(BaseModel):
    """
    Schema for creating a new user.

    Used by admin to create staff accounts.
    """

    username: str = Field(
        ...,
        min_length=3,
        max_length=100,
        pattern=r"^[a-zA-Z0-9_]+$",
        description="Username (alphanumeric and underscores only)",
    )

    password: str = Field(
        ...,
        min_length=6,
        max_length=100,
        description="Password (minimum 6 characters)",
    )

    display_name: str = Field(
        ...,
        min_length=2,
        max_length=200,
        description="Display name for UI",
    )

    email: Optional[EmailStr] = Field(
        None,
        description="Optional email address",
    )

    role: str = Field(
        ...,
        description="User role (front-office or doctor)",
    )

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        """Validate role is one of the allowed values."""
        allowed_roles = ["front-office", "doctor"]
        if v not in allowed_roles:
            raise ValueError(f"Role must be one of: {allowed_roles}")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "username": "newdoctor",
                "password": "secure123",
                "display_name": "Dr. New Doctor",
                "email": "newdoctor@example.com",
                "role": "doctor",
            }
        }


class UserUpdate(BaseModel):
    """
    Schema for updating user information.
    """

    display_name: Optional[str] = Field(
        None,
        min_length=2,
        max_length=200,
        description="Updated display name",
    )

    email: Optional[EmailStr] = Field(
        None,
        description="Updated email address",
    )

    is_active: Optional[bool] = Field(
        None,
        description="Account active status",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "display_name": "Dr. Updated Name",
                "email": "updated@example.com",
            }
        }


class PasswordChange(BaseModel):
    """
    Schema for changing password.
    """

    current_password: str = Field(
        ...,
        description="Current password for verification",
    )

    new_password: str = Field(
        ...,
        min_length=6,
        max_length=100,
        description="New password",
    )

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        """Validate new password strength."""
        if len(v) < 6:
            raise ValueError("New password must be at least 6 characters")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "current_password": "oldpassword123",
                "new_password": "newpassword456",
            }
        }
