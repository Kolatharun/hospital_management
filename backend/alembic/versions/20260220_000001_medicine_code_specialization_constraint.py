"""Update medicine_master unique constraint to (code, specialization)

Revision ID: med_code_spec_constraint
Revises: add_admin_role
Create Date: 2026-02-20 00:00:01

Changes:
- Drop unique constraint on code alone
- Make specialization NOT NULL
- Add unique constraint on (code, specialization)
- Add composite index for (code, specialization)

This allows the same medicine code to exist in different specializations
but prevents duplicates within the same specialization.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'med_code_spec_constraint'
down_revision: Union[str, None] = 'add_admin_role'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # First, update any NULL specialization values to a default
    op.execute("""
        UPDATE medicine_master
        SET specialization = 'General'
        WHERE specialization IS NULL
    """)

    # Drop the existing unique constraint on code alone
    # PostgreSQL auto-creates index for unique columns, so we need to drop it
    op.drop_constraint('medicine_master_code_key', 'medicine_master', type_='unique')

    # Alter column to NOT NULL
    op.alter_column(
        'medicine_master',
        'specialization',
        existing_type=sa.String(100),
        nullable=False
    )

    # Add composite unique constraint on (code, specialization)
    op.create_unique_constraint(
        'uq_medicine_code_specialization',
        'medicine_master',
        ['code', 'specialization']
    )

    # Add composite index for (code, specialization) queries
    op.create_index(
        'ix_medicine_master_code_spec',
        'medicine_master',
        ['code', 'specialization']
    )


def downgrade() -> None:
    # Drop the composite index
    op.drop_index('ix_medicine_master_code_spec', table_name='medicine_master')

    # Drop the composite unique constraint
    op.drop_constraint('uq_medicine_code_specialization', 'medicine_master', type_='unique')

    # Make specialization nullable again
    op.alter_column(
        'medicine_master',
        'specialization',
        existing_type=sa.String(100),
        nullable=True
    )

    # Re-add unique constraint on code alone
    # Note: This may fail if there are now duplicate codes
    op.create_unique_constraint('medicine_master_code_key', 'medicine_master', ['code'])
