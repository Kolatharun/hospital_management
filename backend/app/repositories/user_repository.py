"""
User Repository - User-specific Database Operations

Handles all database queries related to User model.
Used by AuthService for authentication operations.
"""

from typing import Optional, List
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.repositories.base import BaseRepository
from app.models.user import User, UserRole


class UserRepository(BaseRepository[User]):
    """
    Repository for User model operations.

    Provides user-specific queries needed for authentication
    and user management.
    """

    def __init__(self, db: Session):
        """Initialize with User model."""
        super().__init__(User, db)

    def get_by_username(
        self,
        username: str,
        include_inactive: bool = False,
    ) -> Optional[User]:
        """
        Get user by username.

        Used during login to find user account.
        Frontend: LoginPage.tsx username field

        Args:
            username: Login username
            include_inactive: Whether to include inactive accounts

        Returns:
            User if found, None otherwise
        """
        query = self.db.query(User).filter(
            User.username == username,
            User.is_deleted == False,
        )

        if not include_inactive:
            query = query.filter(User.is_active == True)

        return query.first()

    def get_by_email(self, email: str) -> Optional[User]:
        """
        Get user by email address.

        Args:
            email: Email address

        Returns:
            User if found, None otherwise
        """
        return self.db.query(User).filter(
            User.email == email,
            User.is_deleted == False,
        ).first()

    def get_by_username_or_email(
        self,
        username_or_email: str,
        include_inactive: bool = False,
    ) -> Optional[User]:
        """
        Get user by username or email.

        If input contains @, lookup by email. Otherwise lookup by username.

        Args:
            username_or_email: Username or email address
            include_inactive: Whether to include inactive accounts

        Returns:
            User if found, None otherwise
        """
        if "@" in username_or_email:
            query = self.db.query(User).filter(
                User.email == username_or_email,
                User.is_deleted == False,
            )
        else:
            query = self.db.query(User).filter(
                User.username == username_or_email,
                User.is_deleted == False,
            )

        if not include_inactive:
            query = query.filter(User.is_active == True)

        return query.first()

    def get_by_role(
        self,
        role: UserRole,
        skip: int = 0,
        limit: int = 100,
    ) -> List[User]:
        """
        Get all users with a specific role.

        Args:
            role: User role to filter by
            skip: Pagination offset
            limit: Pagination limit

        Returns:
            List of users with the specified role
        """
        return self.db.query(User).filter(
            User.role == role,
            User.is_active == True,
            User.is_deleted == False,
        ).offset(skip).limit(limit).all()

    def get_active_users(
        self,
        skip: int = 0,
        limit: int = 100,
    ) -> List[User]:
        """
        Get all active users.

        Args:
            skip: Pagination offset
            limit: Pagination limit

        Returns:
            List of active users
        """
        return self.db.query(User).filter(
            User.is_active == True,
            User.is_deleted == False,
        ).offset(skip).limit(limit).all()

    def username_exists(self, username: str) -> bool:
        """
        Check if username already exists.

        Used during user creation to prevent duplicates.

        Args:
            username: Username to check

        Returns:
            True if username exists, False otherwise
        """
        return self.db.query(User.id).filter(
            User.username == username,
            User.is_deleted == False,
        ).first() is not None

    def email_exists(self, email: str, exclude_user_id: Optional[UUID] = None) -> bool:
        """
        Check if email already exists.

        Args:
            email: Email to check
            exclude_user_id: Optional user ID to exclude from check (for updates)

        Returns:
            True if email exists, False otherwise
        """
        query = self.db.query(User.id).filter(
            User.email == email,
            User.is_deleted == False,
        )

        if exclude_user_id:
            query = query.filter(User.id != exclude_user_id)

        return query.first() is not None

    def update_last_login(self, user_id: UUID) -> Optional[User]:
        """
        Update user's last login timestamp.

        Called after successful authentication.

        Args:
            user_id: User ID

        Returns:
            Updated user or None if not found
        """
        user = self.get_by_id(user_id)
        if user:
            user.last_login = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(user)
        return user

    def update_password(
        self,
        user_id: UUID,
        password_hash: str,
    ) -> Optional[User]:
        """
        Update user's password hash.

        Args:
            user_id: User ID
            password_hash: New bcrypt password hash

        Returns:
            Updated user or None if not found
        """
        user = self.get_by_id(user_id)
        if user:
            user.password_hash = password_hash
            self.db.commit()
            self.db.refresh(user)
        return user

    def deactivate_user(self, user_id: UUID) -> Optional[User]:
        """
        Deactivate a user account.

        Prevents login without deleting the account.

        Args:
            user_id: User ID

        Returns:
            Updated user or None if not found
        """
        user = self.get_by_id(user_id)
        if user:
            user.is_active = False
            self.db.commit()
            self.db.refresh(user)
        return user

    def activate_user(self, user_id: UUID) -> Optional[User]:
        """
        Activate a user account.

        Args:
            user_id: User ID

        Returns:
            Updated user or None if not found
        """
        user = self.get_by_id(user_id)
        if user:
            user.is_active = True
            self.db.commit()
            self.db.refresh(user)
        return user

    def search_users(
        self,
        query: str,
        skip: int = 0,
        limit: int = 20,
    ) -> List[User]:
        """
        Search users by username or display name.

        Args:
            query: Search query string
            skip: Pagination offset
            limit: Pagination limit

        Returns:
            List of matching users
        """
        search_pattern = f"%{query}%"

        return self.db.query(User).filter(
            User.is_deleted == False,
            or_(
                User.username.ilike(search_pattern),
                User.display_name.ilike(search_pattern),
            ),
        ).offset(skip).limit(limit).all()

    def count_by_role(self, role: UserRole) -> int:
        """
        Count active users by role.

        Args:
            role: Role to count

        Returns:
            Count of users with the role
        """
        return self.db.query(User).filter(
            User.role == role,
            User.is_active == True,
            User.is_deleted == False,
        ).count()

    def get_doctors(self) -> List[User]:
        """
        Get all active doctor users.

        Used for doctor dropdowns in frontend.

        Returns:
            List of users with doctor role
        """
        return self.get_by_role(UserRole.DOCTOR)

    def get_front_office_staff(self) -> List[User]:
        """
        Get all active front office staff.

        Returns:
            List of users with front-office role
        """
        return self.get_by_role(UserRole.FRONT_OFFICE)
