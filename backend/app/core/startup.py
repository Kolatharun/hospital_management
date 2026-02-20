"""
Startup Initialization - Creates folders on startup

Database tables are managed by Alembic migrations.
Run 'alembic upgrade head' before starting the app.

Production-safe:
- Creates folders only if they don't exist
- NO automatic seed data execution
- Admin user must be created manually via: python scripts/create_admin.py
"""

from pathlib import Path


# Directories to create on startup
BACKEND_DIR = Path(__file__).resolve().parents[2]
REQUIRED_FOLDERS = [
    BACKEND_DIR / "uploads" / "documents",
    BACKEND_DIR / "uploads" / "prescriptions",
    BACKEND_DIR / "assets",
]


def create_folders() -> None:
    """Create required folders if they don't exist."""
    for folder in REQUIRED_FOLDERS:
        if not folder.exists():
            folder.mkdir(parents=True, exist_ok=True)
            print(f"  ✓ Created folder: {folder}")


def run_startup_initialization() -> None:
    """
    Main startup initialization function.

    Call this on application startup to ensure:
    - All required folders exist

    Database tables are managed by Alembic migrations.
    Run 'alembic upgrade head' before starting the app.

    NOTE: Seed data is NOT auto-executed.
    To create an admin user, run: python scripts/create_admin.py
    """
    print("\n[Startup] Initializing application...")

    # Create required folders only
    print("[Startup] Checking folders...")
    create_folders()

    print("[Startup] ✓ Initialization complete\n")
