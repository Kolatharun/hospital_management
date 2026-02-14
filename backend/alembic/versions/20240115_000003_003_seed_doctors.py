"""Seed default doctors

Revision ID: 003
Revises: 002
Create Date: 2024-01-15 00:00:03

Seeds default doctors for departments.
This migration is idempotent - it only adds doctors that don't exist.
"""

from typing import Sequence, Union

from alembic import op
from sqlalchemy import text

revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add default doctors if they don't exist."""

    # Check and insert doctors only if they don't exist (by registration_number)
    op.execute(text("""
        INSERT INTO doctors (id, name, department_id, speciality, qualification, registration_number, phone, email, room, consultation_fee, user_id)
        SELECT gen_random_uuid(), 'Dr. R. Balaji',
               (SELECT id FROM departments WHERE code = 'CARD'),
               'Interventional Cardiology', 'MD, DM (Cardiology)', 'MCI-12345',
               '+91 9100079990', 'dr.balaji@balajiheart.com', '1', 500.00,
               (SELECT id FROM users WHERE username = 'doctor')
        WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE registration_number = 'MCI-12345')
    """))

    op.execute(text("""
        INSERT INTO doctors (id, name, department_id, speciality, qualification, registration_number, phone, email, room, consultation_fee, user_id)
        SELECT gen_random_uuid(), 'Dr. Priya Sharma',
               (SELECT id FROM departments WHERE code = 'CARD'),
               'Non-Invasive Cardiology', 'MD, DM (Cardiology)', 'MCI-12346',
               '+91 9100079991', 'dr.priya@balajiheart.com', '2', 450.00,
               (SELECT id FROM users WHERE username = 'priya')
        WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE registration_number = 'MCI-12346')
    """))

    op.execute(text("""
        INSERT INTO doctors (id, name, department_id, speciality, qualification, registration_number, phone, email, room, consultation_fee, user_id)
        SELECT gen_random_uuid(), 'Dr. Rajesh Kumar',
               (SELECT id FROM departments WHERE code = 'GENM'),
               'Internal Medicine', 'MD (Medicine)', 'MCI-12347',
               '+91 9100079992', 'dr.rajesh@balajiheart.com', '3', 300.00,
               (SELECT id FROM users WHERE username = 'rajesh')
        WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE registration_number = 'MCI-12347')
    """))

    op.execute(text("""
        INSERT INTO doctors (id, name, department_id, speciality, qualification, registration_number, phone, email, room, consultation_fee)
        SELECT gen_random_uuid(), 'Dr. Lakshmi Devi',
               (SELECT id FROM departments WHERE code = 'PEDI'),
               'Pediatric Care', 'MD (Pediatrics)', 'MCI-12348',
               '+91 9100079993', 'dr.lakshmi@balajiheart.com', '4', 350.00
        WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE registration_number = 'MCI-12348')
    """))

    op.execute(text("""
        INSERT INTO doctors (id, name, department_id, speciality, qualification, registration_number, phone, email, room, consultation_fee)
        SELECT gen_random_uuid(), 'Dr. Suresh Reddy',
               (SELECT id FROM departments WHERE code = 'DERM'),
               'Clinical Dermatology', 'MD (Dermatology)', 'MCI-12349',
               '+91 9100079994', 'dr.suresh@balajiheart.com', '5', 350.00
        WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE registration_number = 'MCI-12349')
    """))

    # Also link the existing doctor users to their respective doctors if not already linked
    op.execute(text("""
        UPDATE doctors
        SET user_id = (SELECT id FROM users WHERE username = 'doctor')
        WHERE registration_number = 'MCI-12345'
          AND user_id IS NULL
          AND EXISTS (SELECT 1 FROM users WHERE username = 'doctor')
    """))

    op.execute(text("""
        UPDATE doctors
        SET user_id = (SELECT id FROM users WHERE username = 'priya')
        WHERE registration_number = 'MCI-12346'
          AND user_id IS NULL
          AND EXISTS (SELECT 1 FROM users WHERE username = 'priya')
    """))

    op.execute(text("""
        UPDATE doctors
        SET user_id = (SELECT id FROM users WHERE username = 'rajesh')
        WHERE registration_number = 'MCI-12347'
          AND user_id IS NULL
          AND EXISTS (SELECT 1 FROM users WHERE username = 'rajesh')
    """))


def downgrade() -> None:
    """Remove seeded doctors."""
    op.execute(text("""
        DELETE FROM doctors
        WHERE registration_number IN ('MCI-12345', 'MCI-12346', 'MCI-12347', 'MCI-12348', 'MCI-12349')
    """))
