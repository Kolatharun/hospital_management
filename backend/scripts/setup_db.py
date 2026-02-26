#!/usr/bin/env python
"""
Database Setup Script

This script helps set up the database for the Balaji Heart Center backend.
It will:
1. Check PostgreSQL connection
2. Create the database if it doesn't exist
3. Run Alembic migrations

Usage:
    python scripts/setup_db.py

Prerequisites:
    - PostgreSQL must be running
    - Update .env with your PostgreSQL credentials
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_dir))

import subprocess
from urllib.parse import urlparse

from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError


def parse_database_url(url: str) -> dict:
    """Parse DATABASE_URL into components."""
    parsed = urlparse(url)
    return {
        'user': parsed.username,
        'password': parsed.password,
        'host': parsed.hostname,
        'port': parsed.port or 5432,
        'database': parsed.path.lstrip('/'),
    }


def check_postgres_connection(url: str) -> bool:
    """Check if we can connect to PostgreSQL server."""
    try:
        # Connect to default 'postgres' database first
        parsed = parse_database_url(url)
        postgres_url = f"postgresql://{parsed['user']}:{parsed['password']}@{parsed['host']}:{parsed['port']}/postgres"
        engine = create_engine(postgres_url)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine.dispose()
        return True
    except OperationalError as e:
        print(f"Cannot connect to PostgreSQL: {e}")
        return False


def database_exists(url: str) -> bool:
    """Check if the target database exists."""
    try:
        engine = create_engine(url)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine.dispose()
        return True
    except OperationalError:
        return False


def create_database(url: str) -> bool:
    """Create the database if it doesn't exist."""
    parsed = parse_database_url(url)
    db_name = parsed['database']

    # Connect to postgres database to create our database
    postgres_url = f"postgresql://{parsed['user']}:{parsed['password']}@{parsed['host']}:{parsed['port']}/postgres"

    try:
        engine = create_engine(postgres_url, isolation_level="AUTOCOMMIT")
        with engine.connect() as conn:
            # Check if database exists
            result = conn.execute(
                text(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'")
            )
            if not result.fetchone():
                conn.execute(text(f'CREATE DATABASE "{db_name}"'))
                print(f"✓ Created database: {db_name}")
            else:
                print(f"✓ Database already exists: {db_name}")
        engine.dispose()
        return True
    except Exception as e:
        print(f"✗ Error creating database: {e}")
        return False


def run_migrations() -> bool:
    """Run Alembic migrations."""
    try:
        print("\nRunning Alembic migrations...")
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            cwd=backend_dir,
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print("✓ Migrations completed successfully")
            print(result.stdout)
            return True
        else:
            print(f"✗ Migration failed:")
            print(result.stderr)
            return False
    except Exception as e:
        print(f"✗ Error running migrations: {e}")
        return False


def main():
    """Main setup function."""
    print("=" * 60)
    print("Balaji Heart Center - Database Setup")
    print("=" * 60)

    # Load settings
    from app.core.config import settings

    print(f"\nDatabase URL: {settings.DATABASE_URL.replace(settings.DATABASE_URL.split(':')[2].split('@')[0], '****')}")

    # Step 1: Check PostgreSQL connection
    print("\n[1/3] Checking PostgreSQL connection...")
    if not check_postgres_connection(settings.DATABASE_URL):
        print("\n✗ Cannot connect to PostgreSQL server.")
        print("\nPlease ensure:")
        print("  1. PostgreSQL is installed and running")
        print("  2. DATABASE_URL in .env is correct")
        print("  3. The PostgreSQL user has permission to create databases")
        sys.exit(1)
    print("✓ PostgreSQL connection successful")

    # Step 2: Create database
    print("\n[2/3] Creating database if needed...")
    if not create_database(settings.DATABASE_URL):
        print("\n✗ Failed to create database")
        sys.exit(1)

    # Step 3: Run migrations
    print("\n[3/3] Running database migrations...")
    if not run_migrations():
        print("\n✗ Failed to run migrations")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("✓ Database setup completed successfully!")
    print("=" * 60)
    print("\nNext steps:")
    print("  1. Create admin user: python scripts/create_admin.py")
    print("  2. Start the server: uvicorn app.main:app --reload")
    print("  3. Open API docs: http://localhost:8000/docs")


if __name__ == "__main__":
    main()
