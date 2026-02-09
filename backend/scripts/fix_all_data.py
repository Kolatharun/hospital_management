"""
Fix All Data Script - Comprehensive Database Fix

This script fixes all data issues:
1. Resets passwords for existing users (fixes login issues)
2. Creates departments if missing
3. Creates doctors and maps them to departments
4. Creates additional doctor users with proper mappings
5. Links doctor users to doctor records

Usage:
    cd backend
    python scripts/fix_all_data.py
"""

import sys
from pathlib import Path
from uuid import uuid4
from decimal import Decimal

# Add app to path
sys.path.insert(0, str(Path(__file__).parents[1]))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.doctor import Doctor


def fix_passwords(db: Session) -> None:
    """Reset passwords for existing users."""
    print("\n[1/4] Fixing user passwords...")

    # Reset frontoffice password
    fo_user = db.query(User).filter(User.username == "frontoffice").first()
    if fo_user:
        fo_user.password_hash = get_password_hash("front123")
        print("  ✓ Reset password for: frontoffice / front123")
    else:
        # Create frontoffice user
        fo_user = User(
            id=uuid4(),
            username="frontoffice",
            password_hash=get_password_hash("front123"),
            display_name="Front Office Staff",
            email="frontoffice@balajiheart.com",
            role=UserRole.FRONT_OFFICE,
            is_active=True,
        )
        db.add(fo_user)
        print("  ✓ Created user: frontoffice / front123")

    # Reset doctor password
    doc_user = db.query(User).filter(User.username == "doctor").first()
    if doc_user:
        doc_user.password_hash = get_password_hash("doctor123")
        print("  ✓ Reset password for: doctor / doctor123")
    else:
        # Create doctor user
        doc_user = User(
            id=uuid4(),
            username="doctor",
            password_hash=get_password_hash("doctor123"),
            display_name="Dr. R. Balaji",
            email="dr.balaji@balajiheart.com",
            role=UserRole.DOCTOR,
            is_active=True,
        )
        db.add(doc_user)
        print("  ✓ Created user: doctor / doctor123")

    db.flush()
    return doc_user


def create_departments(db: Session) -> dict:
    """Create departments if missing."""
    print("\n[2/4] Creating departments...")

    departments_data = [
        {"code": "CARD", "name": "Cardiology", "fee": Decimal("500.00")},
        {"code": "GENM", "name": "General Medicine", "fee": Decimal("300.00")},
        {"code": "ORTH", "name": "Orthopedics", "fee": Decimal("400.00")},
        {"code": "PEDI", "name": "Pediatrics", "fee": Decimal("350.00")},
        {"code": "DERM", "name": "Dermatology", "fee": Decimal("400.00")},
        {"code": "ENT", "name": "ENT", "fee": Decimal("350.00")},
        {"code": "OPHT", "name": "Ophthalmology", "fee": Decimal("400.00")},
        {"code": "GYNE", "name": "Gynecology", "fee": Decimal("450.00")},
        {"code": "NEUR", "name": "Neurology", "fee": Decimal("600.00")},
        {"code": "GAST", "name": "Gastroenterology", "fee": Decimal("500.00")},
    ]

    dept_map = {}
    created = 0

    for d in departments_data:
        existing = db.query(Department).filter(Department.code == d["code"]).first()
        if not existing:
            dept = Department(
                id=uuid4(),
                code=d["code"],
                name=d["name"],
                base_consultation_fee=d["fee"],
                is_active=True,
            )
            db.add(dept)
            dept_map[d["code"]] = dept
            created += 1
            print(f"  ✓ Created department: {d['name']}")
        else:
            dept_map[d["code"]] = existing

    db.flush()
    print(f"  Total: {created} new department(s)")
    return dept_map


def create_doctors_and_users(db: Session, dept_map: dict, main_doc_user: User) -> None:
    """Create doctors with their own user accounts."""
    print("\n[3/4] Creating doctors and user accounts...")

    doctors_data = [
        {
            "name": "Dr. R. Balaji",
            "dept_code": "CARD",
            "speciality": "Interventional Cardiology",
            "qualification": "MD, DM (Cardiology)",
            "reg_num": "MCI-12345",
            "phone": "+91 9100079990",
            "email": "dr.balaji@balajiheart.com",
            "room": "1",
            "fee": Decimal("500.00"),
            "username": "doctor",  # Link to existing doctor user
        },
        {
            "name": "Dr. Priya Sharma",
            "dept_code": "CARD",
            "speciality": "Non-Invasive Cardiology",
            "qualification": "MD, DM (Cardiology)",
            "reg_num": "MCI-12346",
            "phone": "+91 9100079991",
            "email": "dr.priya@balajiheart.com",
            "room": "2",
            "fee": Decimal("450.00"),
            "username": "dr.priya",
            "password": "priya123",
        },
        {
            "name": "Dr. Rajesh Kumar",
            "dept_code": "GENM",
            "speciality": "Internal Medicine",
            "qualification": "MD (Medicine)",
            "reg_num": "MCI-12347",
            "phone": "+91 9100079992",
            "email": "dr.rajesh@balajiheart.com",
            "room": "3",
            "fee": Decimal("300.00"),
            "username": "dr.rajesh",
            "password": "rajesh123",
        },
        {
            "name": "Dr. Lakshmi Devi",
            "dept_code": "PEDI",
            "speciality": "Pediatric Care",
            "qualification": "MD (Pediatrics)",
            "reg_num": "MCI-12348",
            "phone": "+91 9100079993",
            "email": "dr.lakshmi@balajiheart.com",
            "room": "4",
            "fee": Decimal("350.00"),
            "username": "dr.lakshmi",
            "password": "lakshmi123",
        },
        {
            "name": "Dr. Suresh Reddy",
            "dept_code": "DERM",
            "speciality": "Clinical Dermatology",
            "qualification": "MD (Dermatology)",
            "reg_num": "MCI-12349",
            "phone": "+91 9100079994",
            "email": "dr.suresh@balajiheart.com",
            "room": "5",
            "fee": Decimal("350.00"),
            "username": "dr.suresh",
            "password": "suresh123",
        },
    ]

    doctors_created = 0
    users_created = 0

    for doc_data in doctors_data:
        # Check if doctor exists
        existing_doc = db.query(Doctor).filter(
            Doctor.registration_number == doc_data["reg_num"]
        ).first()

        dept = dept_map.get(doc_data["dept_code"])

        # Get or create user for this doctor
        if doc_data["username"] == "doctor":
            # Use the main doctor user
            user = main_doc_user
        else:
            # Check if user exists
            user = db.query(User).filter(User.username == doc_data["username"]).first()
            if not user:
                user = User(
                    id=uuid4(),
                    username=doc_data["username"],
                    password_hash=get_password_hash(doc_data["password"]),
                    display_name=doc_data["name"],
                    email=doc_data["email"],
                    role=UserRole.DOCTOR,
                    is_active=True,
                )
                db.add(user)
                db.flush()
                users_created += 1
                print(f"  ✓ Created user: {doc_data['username']} / {doc_data['password']}")

        if not existing_doc:
            doctor = Doctor(
                id=uuid4(),
                name=doc_data["name"],
                department_id=dept.id if dept else None,
                speciality=doc_data["speciality"],
                qualification=doc_data["qualification"],
                registration_number=doc_data["reg_num"],
                phone=doc_data["phone"],
                email=doc_data["email"],
                room=doc_data["room"],
                consultation_fee=doc_data["fee"],
                user_id=user.id if user else None,
                is_available=True,
            )
            db.add(doctor)
            doctors_created += 1
            print(f"  ✓ Created doctor: {doc_data['name']} -> linked to user '{doc_data['username']}'")
        else:
            # Update existing doctor with user_id if not set
            if not existing_doc.user_id and user:
                existing_doc.user_id = user.id
                print(f"  ✓ Linked existing doctor {existing_doc.name} to user '{doc_data['username']}'")
            # Update department if not set
            if not existing_doc.department_id and dept:
                existing_doc.department_id = dept.id
                print(f"  ✓ Linked doctor {existing_doc.name} to department {dept.name}")

    db.flush()
    print(f"  Total: {doctors_created} new doctor(s), {users_created} new user(s)")


def verify_data(db: Session) -> None:
    """Verify all data is correct."""
    print("\n[4/4] Verifying data...")

    # Count departments
    dept_count = db.query(Department).filter(
        Department.is_active == True,
        Department.is_deleted == False
    ).count()
    print(f"  Departments: {dept_count}")

    # Count doctors
    doctor_count = db.query(Doctor).filter(
        Doctor.is_available == True,
        Doctor.is_deleted == False
    ).count()
    print(f"  Doctors: {doctor_count}")

    # Count users
    user_count = db.query(User).filter(User.is_active == True).count()
    print(f"  Active Users: {user_count}")

    # List all doctors with their departments and users
    print("\n  Doctor Details:")
    doctors = db.query(Doctor).filter(Doctor.is_deleted == False).all()
    for doc in doctors:
        dept_name = doc.department.name if doc.department else "No Department"
        user_name = ""
        if doc.user_id:
            user = db.query(User).filter(User.id == doc.user_id).first()
            user_name = f" (User: {user.username})" if user else ""
        print(f"    - {doc.name} | {dept_name} | Room {doc.room}{user_name}")


def main():
    """Main function."""
    print("=" * 60)
    print("Balaji Heart Center - Fix All Data")
    print("=" * 60)

    db = SessionLocal()
    try:
        # Step 1: Fix passwords
        main_doc_user = fix_passwords(db)

        # Step 2: Create departments
        dept_map = create_departments(db)

        # Step 3: Create doctors and users
        create_doctors_and_users(db, dept_map, main_doc_user)

        # Commit all changes
        db.commit()

        # Step 4: Verify
        verify_data(db)

        print("\n" + "=" * 60)
        print("✓ All data fixed successfully!")
        print("=" * 60)
        print("\nLogin Credentials:")
        print("  Front Office: frontoffice / front123")
        print("  Doctor (Dr. Balaji): doctor / doctor123")
        print("  Doctor (Dr. Priya): dr.priya / priya123")
        print("  Doctor (Dr. Rajesh): dr.rajesh / rajesh123")
        print("  Doctor (Dr. Lakshmi): dr.lakshmi / lakshmi123")
        print("  Doctor (Dr. Suresh): dr.suresh / suresh123")
        print("\nPlease restart your backend server and refresh the frontend.")

    except Exception as e:
        print(f"\n✗ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
