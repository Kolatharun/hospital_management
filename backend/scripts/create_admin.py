#!/usr/bin/env python
"""
Create Admin User Script

Creates an admin user manually via terminal.
This script prompts for username, password, and email.

Usage:
    python scripts/create_admin.py

Prerequisites:
    - Database must be running and migrations applied
    - Run 'alembic upgrade head' first
"""

import sys
import getpass
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy.orm import Session

from app.core.database import SessionLocal, check_db_connection
from app.core.security import get_password_hash
from app.models.user import User, UserRole


def create_admin_user() -> None:
    """Create an admin user interactively."""
    print("=" * 50)
    print("Create Admin User")
    print("=" * 50)
    print()

    # Check database connection
    if not check_db_connection():
        print("Error: Cannot connect to database.")
        print("Please ensure PostgreSQL is running and DATABASE_URL is set correctly.")
        sys.exit(1)

    db = SessionLocal()
    try:
        # Get username
        while True:
            username = input("Enter admin username: ").strip()
            if not username:
                print("Username cannot be empty.")
                continue
            if len(username) < 3:
                print("Username must be at least 3 characters.")
                continue
            # Check if username exists
            existing = db.query(User).filter(User.username == username).first()
            if existing:
                print(f"Username '{username}' already exists. Choose another.")
                continue
            break

        # Get display name
        display_name = input("Enter display name (e.g., 'System Administrator'): ").strip()
        if not display_name:
            display_name = username.title()

        # Get email (optional)
        email = input("Enter email (optional, press Enter to skip): ").strip()
        if email:
            existing_email = db.query(User).filter(User.email == email).first()
            if existing_email:
                print(f"Email '{email}' already exists. Skipping email.")
                email = None

        # Get password
        while True:
            password = getpass.getpass("Enter password: ")
            if len(password) < 6:
                print("Password must be at least 6 characters.")
                continue
            password_confirm = getpass.getpass("Confirm password: ")
            if password != password_confirm:
                print("Passwords do not match. Try again.")
                continue
            break

        # Create user
        admin_user = User(
            username=username,
            password_hash=get_password_hash(password),
            display_name=display_name,
            email=email if email else None,
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin_user)
        db.commit()

        print()
        print("=" * 50)
        print("Admin user created successfully!")
        print("=" * 50)
        print(f"  Username: {username}")
        print(f"  Display Name: {display_name}")
        print(f"  Role: admin")
        if email:
            print(f"  Email: {email}")
        print()
        print("You can now login with these credentials.")

    except KeyboardInterrupt:
        print("\n\nCancelled.")
        sys.exit(0)
    except Exception as e:
        db.rollback()
        print(f"\nError creating admin user: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    create_admin_user()
