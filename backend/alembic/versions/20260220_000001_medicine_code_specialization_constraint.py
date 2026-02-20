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

    # Drop the existing unique constraint on code alone (if it exists)
    # PostgreSQL auto-creates constraints/indexes for unique columns
    # The constraint name may vary depending on how the table was created
    # Using DO block to safely drop if exists
    op.execute("""
        DO $$
        BEGIN
            -- Try to drop the constraint if it exists
            IF EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'medicine_master_code_key'
                AND conrelid = 'medicine_master'::regclass
            ) THEN
                ALTER TABLE medicine_master DROP CONSTRAINT medicine_master_code_key;
            END IF;

            -- Also try to drop the auto-generated unique index if it exists
            IF EXISTS (
                SELECT 1 FROM pg_indexes
                WHERE indexname = 'medicine_master_code_key'
                AND tablename = 'medicine_master'
            ) THEN
                DROP INDEX medicine_master_code_key;
            END IF;
        END $$;
    """)

    # Alter column to NOT NULL
    op.alter_column(
        'medicine_master',
        'specialization',
        existing_type=sa.String(100),
        nullable=False
    )

    # Add composite unique constraint on (code, specialization) if not exists
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'uq_medicine_code_specialization'
                AND conrelid = 'medicine_master'::regclass
            ) THEN
                ALTER TABLE medicine_master
                ADD CONSTRAINT uq_medicine_code_specialization UNIQUE (code, specialization);
            END IF;
        END $$;
    """)

    # Add composite index for (code, specialization) queries if not exists
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_medicine_master_code_spec
        ON medicine_master (code, specialization);
    """)


def downgrade() -> None:
    # Drop the composite index (if exists)
    op.execute("""
        DROP INDEX IF EXISTS ix_medicine_master_code_spec;
    """)

    # Drop the composite unique constraint (if exists)
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'uq_medicine_code_specialization'
                AND conrelid = 'medicine_master'::regclass
            ) THEN
                ALTER TABLE medicine_master DROP CONSTRAINT uq_medicine_code_specialization;
            END IF;
        END $$;
    """)

    # Make specialization nullable again
    op.alter_column(
        'medicine_master',
        'specialization',
        existing_type=sa.String(100),
        nullable=True
    )

    # Re-add unique constraint on code alone (if not exists)
    # Note: This may fail if there are now duplicate codes
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'medicine_master_code_key'
                AND conrelid = 'medicine_master'::regclass
            ) THEN
                ALTER TABLE medicine_master ADD CONSTRAINT medicine_master_code_key UNIQUE (code);
            END IF;
        END $$;
    """)
