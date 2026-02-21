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
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy.orm import Session

from app.core.database import SessionLocal, check_db_connection
from app.core.security import get_password_hash
from app.models.user import User, UserRole


def get_password_input(prompt: str) -> str:
    """Get password input with Windows terminal support."""
    if sys.platform == "win32":
        import msvcrt
        print(prompt, end="", flush=True)
        password = []
        while True:
            char = msvcrt.getwch()
            if char in ('\r', '\n'):
                print()
                break
            elif char == '\x03':
                raise KeyboardInterrupt
            elif char == '\x08':
                if password:
                    password.pop()
                    print('\b \b', end="", flush=True)
            else:
                password.append(char)
                print('*', end="", flush=True)
        return ''.join(password)
    else:
        import getpass
        return getpass.getpass(prompt)


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
        # Check if admin already exists - only ONE admin allowed
        existing_admin = db.query(User).filter(
            User.role == UserRole.ADMIN,
            User.is_deleted == False
        ).first()
        if existing_admin:
            print("Error: Admin user already exists. Only one admin is allowed.")
            print(f"Existing admin username: {existing_admin.username}")
            sys.exit(1)

        # Get username
        while True:
            username = input("Enter admin username: ").strip()
            if not username:
                print("Error: Username cannot be empty.")
                continue
            if len(username) < 3:
                print("Error: Username must be at least 3 characters.")
                continue
            # Check if username exists
            existing = db.query(User).filter(User.username == username).first()
            if existing:
                print(f"Error: Username '{username}' already exists. Choose another.")
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
                print(f"Warning: Email '{email}' already exists. Skipping email.")
                email = None

        # Get password with Windows support
        while True:
            password = get_password_input("Enter password: ")
            if not password:
                print("Error: Password cannot be empty.")
                continue
            if len(password) < 6:
                print("Error: Password must be at least 6 characters.")
                continue
            password_confirm = get_password_input("Confirm password: ")
            if password != password_confirm:
                print("Error: Passwords do not match. Try again.")
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
