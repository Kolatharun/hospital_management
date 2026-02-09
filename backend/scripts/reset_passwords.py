"""
Reset passwords for existing users.
Run this after fixing bcrypt version to re-hash passwords correctly.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User


def reset_passwords():
    """Reset passwords for demo users."""
    print("Resetting passwords with correct bcrypt version...")

    db = SessionLocal()
    try:
        # Reset frontoffice password
        fo_user = db.query(User).filter(User.username == "frontoffice").first()
        if fo_user:
            fo_user.password_hash = get_password_hash("front123")
            print("  ✓ Reset password for: frontoffice")

        # Reset doctor password
        doc_user = db.query(User).filter(User.username == "doctor").first()
        if doc_user:
            doc_user.password_hash = get_password_hash("doctor123")
            print("  ✓ Reset password for: doctor")

        db.commit()
        print("\n✓ Passwords reset successfully!")
        print("\nDemo Credentials:")
        print("  Front Office: frontoffice / front123")
        print("  Doctor: doctor / doctor123")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    reset_passwords()
