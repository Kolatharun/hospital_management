"""
Security Module - Password Hashing and JWT Token Management

Authentication flow derived from frontend:
- LoginPage.tsx: Username/password authentication
- AuthContext.tsx: Token storage and session management
- Header.tsx: Role-based display
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import settings


# Password hashing context using bcrypt
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=settings.BCRYPT_ROUNDS,
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.

    Args:
        plain_password: The plain text password to verify
        hashed_password: The hashed password to compare against

    Returns:
        True if passwords match, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Generate a bcrypt hash for a password.

    Args:
        password: The plain text password to hash

    Returns:
        The bcrypt hashed password
    """
    return pwd_context.hash(password)


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.

    Token payload includes:
    - sub: User identifier (user_id)
    - role: User role (front-office, doctor)
    - name: Display name (shown in Header.tsx)
    - exp: Expiration timestamp

    Args:
        data: Dictionary containing token payload
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access"
    })

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

    return encoded_jwt


def create_refresh_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT refresh token.

    Refresh tokens are used to obtain new access tokens
    without requiring the user to re-authenticate.

    Args:
        data: Dictionary containing minimal token payload (user_id)
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT refresh token string
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh"
    })

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate a JWT token.

    Args:
        token: The JWT token string to decode

    Returns:
        Decoded token payload if valid, None if invalid or expired

    Raises:
        None - Returns None on any error for security
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def is_token_expired(token: str) -> bool:
    """
    Check if a token is expired.

    Args:
        token: The JWT token string to check

    Returns:
        True if token is expired or invalid, False otherwise
    """
    payload = decode_token(token)
    if payload is None:
        return True

    exp = payload.get("exp")
    if exp is None:
        return True

    return datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(timezone.utc)


def get_token_data(token: str) -> Optional[Dict[str, Any]]:
    """
    Extract user data from a valid token.

    Returns the essential user information needed by the frontend:
    - user_id (sub)
    - role
    - name

    Args:
        token: The JWT token string

    Returns:
        Dictionary with user data if valid, None otherwise
    """
    payload = decode_token(token)
    if payload is None:
        return None

    return {
        "user_id": payload.get("sub"),
        "role": payload.get("role"),
        "name": payload.get("name"),
        "doctor_id": payload.get("doctor_id"),  # If user is a doctor
    }
