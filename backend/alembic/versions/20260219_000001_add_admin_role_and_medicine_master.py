"""Add admin role support and medicine master table

Revision ID: add_admin_role
Revises: 4257e363d9e7
Create Date: 2026-02-19 00:00:01

Changes:
- Adds admin role support (no DB change needed - role is VARCHAR)
- Creates medicine_master table for medicine management
- Seeds admin user with proper bcrypt password hash
"""

from typing import Sequence, Union
from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'add_admin_role'
down_revision: Union[str, None] = '4257e363d9e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create medicine_master table
    op.create_table(
        'medicine_master',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('code', sa.String(50), nullable=False, unique=True, index=True,
                  comment='Unique medicine code'),
        sa.Column('name', sa.String(255), nullable=False, index=True,
                  comment='Medicine brand name'),
        sa.Column('generic_name', sa.String(255), nullable=True,
                  comment='Generic/chemical name'),
        sa.Column('category', sa.String(100), nullable=True, index=True,
                  comment='Medicine category (e.g., Blood Pressure, CAD)'),
        sa.Column('specialization', sa.String(100), nullable=True, index=True,
                  comment='Medical specialization (e.g., Cardiology)'),
        sa.Column('dosage_form', sa.String(50), nullable=True,
                  comment='Form of medicine (Tablet, Capsule, etc.)'),
        sa.Column('strength', sa.String(50), nullable=True,
                  comment='Strength/dosage (e.g., 5mg, 10ml)'),
        sa.Column('manufacturer', sa.String(200), nullable=True,
                  comment='Manufacturer name'),
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False, index=True,
                  comment='Whether medicine is currently available'),
        # Timestamp fields
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now(), onupdate=sa.func.now()),
        # Soft delete
        sa.Column('is_deleted', sa.Boolean(), default=False, nullable=False, index=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )

    # Create indexes
    op.create_index('ix_medicine_master_name_active', 'medicine_master', ['name', 'is_active'])
    op.create_index('ix_medicine_master_category_spec', 'medicine_master', ['category', 'specialization'])

    # Seed admin user
    # Password: admin123 (bcrypt hash with 12 rounds)
    # Generated using: from passlib.context import CryptContext; CryptContext(schemes=["bcrypt"]).hash("admin123")
    op.execute("""
        INSERT INTO users (id, username, password_hash, display_name, email, role, is_active, created_at, updated_at, is_deleted)
        VALUES (
            'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
            'admin',
            '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G6FQqy8bUm0vYi',
            'System Administrator',
            'admin@balajiheart.com',
            'admin',
            true,
            NOW(),
            NOW(),
            false
        )
        ON CONFLICT (username) DO NOTHING;
    """)

    # Seed initial medicines for cardiology
    op.execute("""
        INSERT INTO medicine_master (id, code, name, generic_name, category, specialization, dosage_form, strength, manufacturer, is_active, created_at, updated_at, is_deleted)
        VALUES
        ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380001', 'MED001', 'Amlodipine', 'Amlodipine Besylate', 'Blood Pressure', 'Cardiology', 'Tablet', '5mg', 'Cipla', true, NOW(), NOW(), false),
        ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380002', 'MED002', 'Aspirin', 'Acetylsalicylic Acid', 'Blood Pressure', 'Cardiology', 'Tablet', '75mg', 'Bayer', true, NOW(), NOW(), false),
        ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380003', 'MED003', 'Atorvastatin', 'Atorvastatin Calcium', 'CAD', 'Cardiology', 'Tablet', '10mg', 'Pfizer', true, NOW(), NOW(), false),
        ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380004', 'MED004', 'Metoprolol', 'Metoprolol Tartrate', 'Heart Failure', 'Cardiology', 'Tablet', '50mg', 'AstraZeneca', true, NOW(), NOW(), false),
        ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380005', 'MED005', 'Clopidogrel', 'Clopidogrel Bisulfate', 'CAD', 'Cardiology', 'Tablet', '75mg', 'Sanofi', true, NOW(), NOW(), false)
        ON CONFLICT (code) DO NOTHING;
    """)


def downgrade() -> None:
    # Remove seeded medicines
    op.execute("DELETE FROM medicine_master WHERE code IN ('MED001', 'MED002', 'MED003', 'MED004', 'MED005')")

    # Remove admin user
    op.execute("DELETE FROM users WHERE username = 'admin'")

    # Drop indexes
    op.drop_index('ix_medicine_master_category_spec', table_name='medicine_master')
    op.drop_index('ix_medicine_master_name_active', table_name='medicine_master')

    # Drop medicine_master table
    op.drop_table('medicine_master')
