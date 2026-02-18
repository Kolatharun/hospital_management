"""
Startup Initialization - Creates folders and seeds default data

Database tables are managed by Alembic migrations.
Run 'alembic upgrade head' before starting the app.

Safe for production:
- Creates default data only if not present (no duplicates)
- Creates folders only if they don't exist
- Never deletes or resets existing data
"""

import os
from pathlib import Path
from uuid import uuid4
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import get_password_hash


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




def seed_departments(db: Session) -> dict:
    """Create default departments if they don't exist."""
    from app.models.department import Department
    from sqlalchemy import or_

    departments_data = [
        {"code": "CARDIO", "name": "Cardiology", "description": "Heart and cardiovascular care", "base_consultation_fee": Decimal("500.00")},
        {"code": "GENMED", "name": "General Medicine", "description": "General medical consultations", "base_consultation_fee": Decimal("300.00")},
        {"code": "ORTHO", "name": "Orthopedics", "description": "Bone and joint care", "base_consultation_fee": Decimal("400.00")},
        {"code": "PEDIA", "name": "Pediatrics", "description": "Child healthcare", "base_consultation_fee": Decimal("350.00")},
        {"code": "DERM", "name": "Dermatology", "description": "Skin care", "base_consultation_fee": Decimal("350.00")},
        {"code": "ENT", "name": "ENT", "description": "Ear, Nose, and Throat", "base_consultation_fee": Decimal("350.00")},
        {"code": "OPTHAL", "name": "Ophthalmology", "description": "Eye care", "base_consultation_fee": Decimal("350.00")},
        {"code": "GYNEC", "name": "Gynecology", "description": "Women's health", "base_consultation_fee": Decimal("400.00")},
        {"code": "NEURO", "name": "Neurology", "description": "Brain and nervous system", "base_consultation_fee": Decimal("500.00")},
        {"code": "GASTRO", "name": "Gastroenterology", "description": "Digestive system care", "base_consultation_fee": Decimal("450.00")},
    ]

    dept_map = {}
    created = 0

    for dept_data in departments_data:
        existing = db.query(Department).filter(
            or_(
                Department.code == dept_data["code"],
                Department.name == dept_data["name"]
            )
        ).first()
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
        else:
            dept_map[dept_data["code"]] = existing

    if created > 0:
        db.flush()
        print(f"  ✓ Created {created} department(s)")

    return dept_map


def seed_doctors(db: Session, dept_map: dict) -> dict:
    """Create default doctors if they don't exist."""
    from app.models.doctor import Doctor

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
            "consultation_fee": Decimal("500.00"),
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
            "consultation_fee": Decimal("450.00"),
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
            "consultation_fee": Decimal("300.00"),
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
            "consultation_fee": Decimal("350.00"),
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
            "consultation_fee": Decimal("350.00"),
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
        else:
            doc_map[doc_data["registration_number"]] = existing

    if created > 0:
        db.flush()
        print(f"  ✓ Created {created} doctor(s)")

    return doc_map


def seed_users(db: Session, doc_map: dict) -> None:
    """Create default users if they don't exist."""
    from app.models.user import User, UserRole
    from app.models.doctor import Doctor

    users_created = 0

    def link_user_to_doctor(user_id, doctor):
        """Link a user to a doctor only if no other doctor has this user_id."""
        if not doctor or doctor.user_id:
            return
        # Check if any other doctor already has this user_id
        existing_link = db.query(Doctor).filter(Doctor.user_id == user_id).first()
        if not existing_link:
            doctor.user_id = user_id

    # Front Office user
    if not db.query(User).filter(User.username == "frontoffice").first():
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

    # Doctor user - Dr. R. Balaji
    existing_doc = db.query(User).filter(User.username == "doctor").first()
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
        db.flush()
        balaji_doc = doc_map.get("19870")
        link_user_to_doctor(doctor_user.id, balaji_doc)
        users_created += 1
    else:
        balaji_doc = doc_map.get("19870")
        link_user_to_doctor(existing_doc.id, balaji_doc)

    # Doctor user - Dr. Priya Sharma
    existing_priya = db.query(User).filter(User.username == "priya").first()
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
        db.flush()
        priya_doc = doc_map.get("MCI-12346")
        link_user_to_doctor(priya_user.id, priya_doc)
        users_created += 1
    else:
        priya_doc = doc_map.get("MCI-12346")
        link_user_to_doctor(existing_priya.id, priya_doc)

    # Doctor user - Dr. Rajesh Kumar
    existing_rajesh = db.query(User).filter(User.username == "rajesh").first()
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
        db.flush()
        rajesh_doc = doc_map.get("MCI-12347")
        link_user_to_doctor(rajesh_user.id, rajesh_doc)
        users_created += 1
    else:
        rajesh_doc = doc_map.get("MCI-12347")
        link_user_to_doctor(existing_rajesh.id, rajesh_doc)

    if users_created > 0:
        print(f"  ✓ Created {users_created} user(s)")


def run_startup_initialization() -> None:
    """
    Main startup initialization function.

    Call this on application startup to ensure:
    - All required folders exist
    - Default data (departments, doctors, users) exists

    Database tables are managed by Alembic migrations.
    Run 'alembic upgrade head' before starting the app.
    """
    print("\n[Startup] Initializing application...")

    # 1. Create required folders
    print("[Startup] Checking folders...")
    create_folders()

    # 2. Seed default data
    print("[Startup] Checking default data...")
    db = SessionLocal()
    try:
        dept_map = seed_departments(db)
        doc_map = seed_doctors(db, dept_map)
        seed_users(db, doc_map)
        db.commit()
        print("[Startup] ✓ Initialization complete\n")
    except Exception as e:
        db.rollback()
        print(f"[Startup] ✗ Error during initialization: {e}\n")
        raise
    finally:
        db.close()
