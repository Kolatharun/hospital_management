"""
Seed Data Script - Initialize Database with Demo Data

Creates demo users matching frontend LoginPage.tsx credentials:
- frontoffice / front123 (Front Office role)
- doctor / doctor123 (Doctor role)

Also creates departments and doctors for the clinic.

Usage:
    python scripts/seed_data.py

Note: Run this after applying Alembic migrations.
"""

import sys
from pathlib import Path
from uuid import uuid4

# Add app to path
sys.path.insert(0, str(Path(__file__).parents[1]))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.doctor import Doctor


def seed_departments(db: Session) -> dict:
    """
    Create departments for the clinic.
    Returns a dict mapping department codes to department objects.
    """
    print("Seeding departments...")

    departments_data = [
        {"code": "CARDIO", "name": "Cardiology", "description": "Heart and cardiovascular care", "base_consultation_fee": 500},
        {"code": "GENMED", "name": "General Medicine", "description": "General medical consultations", "base_consultation_fee": 300},
        {"code": "ORTHO", "name": "Orthopedics", "description": "Bone and joint care", "base_consultation_fee": 400},
        {"code": "PEDIA", "name": "Pediatrics", "description": "Child healthcare", "base_consultation_fee": 350},
        {"code": "DERM", "name": "Dermatology", "description": "Skin care", "base_consultation_fee": 350},
        {"code": "ENT", "name": "ENT", "description": "Ear, Nose, and Throat", "base_consultation_fee": 350},
        {"code": "OPTHAL", "name": "Ophthalmology", "description": "Eye care", "base_consultation_fee": 350},
        {"code": "GYNEC", "name": "Gynecology", "description": "Women's health", "base_consultation_fee": 400},
        {"code": "NEURO", "name": "Neurology", "description": "Brain and nervous system", "base_consultation_fee": 500},
        {"code": "GASTRO", "name": "Gastroenterology", "description": "Digestive system care", "base_consultation_fee": 450},
    ]

    dept_map = {}
    created = 0

    for dept_data in departments_data:
        existing = db.query(Department).filter(Department.code == dept_data["code"]).first()
        if not existing:
            dept = Department(
                id=uuid4(),
                code=dept_data["code"],
                name=dept_data["name"],
                description=dept_data["description"],
                base_consultation_fee=dept_data["base_consultation_fee"],
                is_active=True,
            )
            db.add(dept)
            dept_map[dept_data["code"]] = dept
            created += 1
            print(f"  ✓ Created department: {dept_data['name']}")
        else:
            dept_map[dept_data["code"]] = existing
            print(f"  - Department already exists: {dept_data['name']}")

    if created > 0:
        db.flush()
        print(f"\n✓ Created {created} department(s)")

    return dept_map


def seed_doctors(db: Session, dept_map: dict) -> dict:
    """
    Create doctors for the clinic.
    Returns a dict mapping registration numbers to doctor objects.
    """
    print("\nSeeding doctors...")

    doctors_data = [
        {
            "name": "Dr. R. Balaji",
            "dept_code": "CARDIO",
            "speciality": "Senior Interventional Cardiologist",
            "qualification": "MD, DM, FSCAI (USA)",
            "registration_number": "19870",
            "phone": "+91 9100079990",
            "email": "dr.balaji@balajiheart.com",
            "room": "1",
            "consultation_fee": 500,
        },
        {
            "name": "Dr. Priya Sharma",
            "dept_code": "CARDIO",
            "speciality": "Non-Invasive Cardiology",
            "qualification": "MD, DM (Cardiology)",
            "registration_number": "MCI-12346",
            "phone": "+91 9100079991",
            "email": "dr.priya@balajiheart.com",
            "room": "2",
            "consultation_fee": 450,
        },
        {
            "name": "Dr. Rajesh Kumar",
            "dept_code": "GENMED",
            "speciality": "Internal Medicine",
            "qualification": "MD (Medicine)",
            "registration_number": "MCI-12347",
            "phone": "+91 9100079992",
            "email": "dr.rajesh@balajiheart.com",
            "room": "3",
            "consultation_fee": 300,
        },
        {
            "name": "Dr. Lakshmi Devi",
            "dept_code": "PEDIA",
            "speciality": "Pediatric Care",
            "qualification": "MD (Pediatrics)",
            "registration_number": "MCI-12348",
            "phone": "+91 9100079993",
            "email": "dr.lakshmi@balajiheart.com",
            "room": "4",
            "consultation_fee": 350,
        },
        {
            "name": "Dr. Suresh Reddy",
            "dept_code": "DERM",
            "speciality": "Clinical Dermatology",
            "qualification": "MD (Dermatology)",
            "registration_number": "MCI-12349",
            "phone": "+91 9100079994",
            "email": "dr.suresh@balajiheart.com",
            "room": "5",
            "consultation_fee": 350,
        },
    ]

    doc_map = {}
    created = 0

    for doc_data in doctors_data:
        existing = db.query(Doctor).filter(Doctor.registration_number == doc_data["registration_number"]).first()
        if not existing:
            dept = dept_map.get(doc_data["dept_code"])
            doc = Doctor(
                id=uuid4(),
                name=doc_data["name"],
                department_id=dept.id if dept else None,
                speciality=doc_data["speciality"],
                qualification=doc_data["qualification"],
                registration_number=doc_data["registration_number"],
                phone=doc_data["phone"],
                email=doc_data["email"],
                room=doc_data["room"],
                consultation_fee=doc_data["consultation_fee"],
                is_available=True,
            )
            db.add(doc)
            doc_map[doc_data["registration_number"]] = doc
            created += 1
            print(f"  ✓ Created doctor: {doc_data['name']}")
        else:
            doc_map[doc_data["registration_number"]] = existing
            print(f"  - Doctor already exists: {doc_data['name']}")

    if created > 0:
        db.flush()
        print(f"\n✓ Created {created} doctor(s)")

    return doc_map


def seed_users(db: Session, doc_map: dict) -> None:
    """
    Create demo user accounts.

    These match the frontend LoginPage.tsx demo credentials.
    Note: Doctor.user_id links to User, not User.doctor_id to Doctor.
    """
    print("\nSeeding demo users...")

    # Check if users already exist
    existing_fo = db.query(User).filter(User.username == "frontoffice").first()
    existing_doc = db.query(User).filter(User.username == "doctor").first()
    existing_priya = db.query(User).filter(User.username == "priya").first()
    existing_rajesh = db.query(User).filter(User.username == "rajesh").first()

    users_created = 0

    # Front Office user
    if not existing_fo:
        front_office_user = User(
            username="frontoffice",
            password_hash=get_password_hash("front123"),
            display_name="Front Office Staff",
            email="frontoffice@balajiheart.com",
            role=UserRole.FRONT_OFFICE,
            is_active=True,
        )
        db.add(front_office_user)
        users_created += 1
        print("  ✓ Created front office user: frontoffice / front123")
    else:
        print("  - Front office user already exists")

    # Doctor user - link to Dr. R. Balaji
    if not existing_doc:
        doctor_user = User(
            username="doctor",
            password_hash=get_password_hash("doctor123"),
            display_name="Dr. R. Balaji",
            email="dr.balaji@balajiheart.com",
            role=UserRole.DOCTOR,
            is_active=True,
        )
        db.add(doctor_user)
        db.flush()  # Get the user ID

        # Link the doctor record to this user (Doctor.user_id -> User.id)
        balaji_doc = doc_map.get("19870")
        if balaji_doc:
            balaji_doc.user_id = doctor_user.id
            print(f"  ✓ Linked doctor user to Dr. R. Balaji (Doctor ID: {balaji_doc.id})")

        users_created += 1
        print("  ✓ Created doctor user: doctor / doctor123")
    else:
        print("  - Doctor user already exists")
        # Still try to link existing user to doctor if not linked
        balaji_doc = doc_map.get("19870")
        if balaji_doc and not balaji_doc.user_id:
            balaji_doc.user_id = existing_doc.id
            print(f"  ✓ Linked existing doctor user to Dr. R. Balaji")

    # Doctor user - link to Dr. Priya Sharma
    if not existing_priya:
        priya_user = User(
            username="priya",
            password_hash=get_password_hash("priya123"),
            display_name="Dr. Priya Sharma",
            email="dr.priya@balajiheart.com",
            role=UserRole.DOCTOR,
            is_active=True,
        )
        db.add(priya_user)
        db.flush()  # Get the user ID

        # Link the doctor record to this user (Doctor.user_id -> User.id)
        priya_doc = doc_map.get("MCI-12346")
        if priya_doc:
            priya_doc.user_id = priya_user.id
            print(f"  ✓ Linked doctor user to Dr. Priya Sharma (Doctor ID: {priya_doc.id})")

        users_created += 1
        print("  ✓ Created doctor user: priya / priya123")
    else:
        print("  - Dr. Priya Sharma user already exists")
        # Still try to link existing user to doctor if not linked
        priya_doc = doc_map.get("MCI-12346")
        if priya_doc and not priya_doc.user_id:
            priya_doc.user_id = existing_priya.id
            print(f"  ✓ Linked existing doctor user to Dr. Priya Sharma")

    # Doctor user - link to Dr. Rajesh Kumar
    if not existing_rajesh:
        rajesh_user = User(
            username="rajesh",
            password_hash=get_password_hash("rajesh123"),
            display_name="Dr. Rajesh Kumar",
            email="dr.rajesh@balajiheart.com",
            role=UserRole.DOCTOR,
            is_active=True,
        )
        db.add(rajesh_user)
        db.flush()  # Get the user ID

        # Link the doctor record to this user (Doctor.user_id -> User.id)
        rajesh_doc = doc_map.get("MCI-12347")
        if rajesh_doc:
            rajesh_doc.user_id = rajesh_user.id
            print(f"  ✓ Linked doctor user to Dr. Rajesh Kumar (Doctor ID: {rajesh_doc.id})")

        users_created += 1
        print("  ✓ Created doctor user: rajesh / rajesh123")
    else:
        print("  - Dr. Rajesh Kumar user already exists")
        # Still try to link existing user to doctor if not linked
        rajesh_doc = doc_map.get("MCI-12347")
        if rajesh_doc and not rajesh_doc.user_id:
            rajesh_doc.user_id = existing_rajesh.id
            print(f"  ✓ Linked existing doctor user to Dr. Rajesh Kumar")

    if users_created > 0:
        db.commit()
        print(f"\n✓ Created {users_created} demo user(s)")
    else:
        db.commit()  # Commit any doctor-user linkage
        print("\n- No new users created (already exist)")


def main():
    """Main seed function."""
    print("=" * 50)
    print("Balaji Heart Center - Database Seed Script")
    print("=" * 50)
    print()

    db = SessionLocal()
    try:
        # Seed in order: departments -> doctors -> users
        dept_map = seed_departments(db)
        doc_map = seed_doctors(db, dept_map)
        seed_users(db, doc_map)

        db.commit()

        print("\n" + "=" * 50)
        print("✓ Seed completed successfully!")
        print("=" * 50)
        print("\nDemo Credentials:")
        print("  Front Office: frontoffice / front123")
        print("  Doctor (Dr. R. Balaji): doctor / doctor123")
        print("  Doctor (Dr. Priya Sharma): priya / priya123")
        print("  Doctor (Dr. Rajesh Kumar): rajesh / rajesh123")
        print("\nDepartments created: 10")
        print("Doctors created: 5")
    except Exception as e:
        print(f"\n✗ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
