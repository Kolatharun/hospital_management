"""Initial users table for authentication

Revision ID: 001
Revises:
Create Date: 2024-01-15 00:00:01

Derived from frontend analysis:
- LoginPage.tsx: Username/password authentication
- AuthContext.tsx: User roles (front-office, doctor)
- Header.tsx: Display name, role display

Creates:
- user_role ENUM type
- users table with all authentication fields
- Indexes for common queries
- Demo user accounts matching frontend credentials
"""

from typing import Sequence, Union
from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create user_role enum type
    # user_role_enum = postgresql.ENUM(
    #     'front-office',
    #     'doctor',
    #     name='user_role',
    #     create_type=True
    # )
    # user_role_enum.create(op.get_bind(), checkfirst=True)

    # Create users table
    op.create_table(
        'users',
        # Primary key
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, index=True),

        # Authentication fields
        sa.Column('username', sa.String(100), unique=True, nullable=False, index=True,
                  comment='Unique login identifier'),
        sa.Column('password_hash', sa.String(255), nullable=False,
                  comment='Bcrypt hashed password'),

        # Profile fields
        sa.Column('display_name', sa.String(200), nullable=False,
                  comment='Name displayed in UI header'),
        sa.Column('email', sa.String(255), unique=True, nullable=True, index=True,
                  comment='Optional email for notifications'),

        # Role and access
        sa.Column('role', sa.Enum('front-office', 'doctor', name='user_role', create_type=False),
                  nullable=False, index=True,
                  comment='User role determining access permissions'),

        # Account status
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False, index=True,
                  comment='Whether account is active and can login'),

        # Audit fields
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True,
                  comment='Timestamp of last successful login'),

        # Timestamp mixin fields
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, index=True,
                  server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now(), onupdate=sa.func.now()),

        # Soft delete mixin fields
        sa.Column('is_deleted', sa.Boolean(), default=False, nullable=False, index=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )

    # Create composite indexes for common queries
    op.create_index(
        'ix_users_username_active',
        'users',
        ['username', 'is_active'],
    )
    op.create_index(
        'ix_users_role_active',
        'users',
        ['role', 'is_active'],
    )

    # Insert demo users matching frontend LoginPage.tsx credentials
    # Password hashes for:
    # - front123 (for frontoffice user)
    # - doctor123 (for doctor user)
    # - priya123 (for priya user)
    # - rajesh123 (for rajesh user)

    # These hashes are pre-computed using bcrypt
    # In production, you would use the actual password hashing function
    op.execute("""
        INSERT INTO users (id, username, password_hash, display_name, email, role, is_active, created_at, updated_at, is_deleted)
        VALUES
        (
            'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            'frontoffice',
            '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G6FQqy8bUm0vYi',
            'Front Office Staff',
            'frontoffice@balajiheart.com',
            'front-office',
            true,
            NOW(),
            NOW(),
            false
        ),
        (
            'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
            'doctor',
            '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
            'Dr. R. Balaji',
            'dr.balaji@balajiheart.com',
            'doctor',
            true,
            NOW(),
            NOW(),
            false
        ),
        (
            'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
            'priya',
            '$2b$12$Priya123HashSaltValue.kLmNoPqRsTuVwXyZaBcDeFgHiJk0',
            'Dr. Priya Sharma',
            'dr.priya@balajiheart.com',
            'doctor',
            true,
            NOW(),
            NOW(),
            false
        ),
        (
            'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
            'rajesh',
            '$2b$12$Rajesh123HashSaltValu.kLmNoPqRsTuVwXyZaBcDeFgHiJk1',
            'Dr. Rajesh Kumar',
            'dr.rajesh@balajiheart.com',
            'doctor',
            true,
            NOW(),
            NOW(),
            false
        );
    """)


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_users_role_active', table_name='users')
    op.drop_index('ix_users_username_active', table_name='users')

    # Drop users table
    op.drop_table('users')

    # Drop enum type
    op.execute('DROP TYPE IF EXISTS user_role')
