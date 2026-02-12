"""Fix queue_status_enum: convert native ENUM to VARCHAR for pending/cancelled support

The original migration created queue_status_enum with only 3 values
(waiting, in-progress, completed). The QueueStatus Python enum has 5 values
(pending, waiting, in-progress, completed, cancelled). Changing to VARCHAR
avoids native enum sync issues and supports all status values.

Revision ID: fix_queue_status_enum
Revises: add_buffer_time
Create Date: 2026-02-12 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = 'fix_queue_status_enum'
down_revision: Union[str, None] = 'add_buffer_time'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # Check if queue_status_enum exists as a native PostgreSQL ENUM type
    result = conn.execute(text(
        "SELECT 1 FROM pg_type WHERE typname = 'queue_status_enum'"
    ))
    has_native_enum = result.scalar() is not None

    if has_native_enum:
        for table in ("lab_queue_items", "pharmacy_queue_items"):
            # Drop the default that references the enum type
            op.execute(text(
                f"ALTER TABLE {table} ALTER COLUMN status DROP DEFAULT"
            ))
            # Convert column from native ENUM to VARCHAR
            op.execute(text(
                f"ALTER TABLE {table} "
                f"ALTER COLUMN status TYPE VARCHAR(20) USING status::text"
            ))
            # Re-add default as a plain string
            op.execute(text(
                f"ALTER TABLE {table} "
                f"ALTER COLUMN status SET DEFAULT 'waiting'"
            ))

        # Drop the old native enum type (no longer needed)
        op.execute(text("DROP TYPE queue_status_enum"))
    else:
        # Column is already VARCHAR (native_enum=False was used at table creation).
        # Ensure the column length is correct by altering to VARCHAR(20) if needed.
        for table in ("lab_queue_items", "pharmacy_queue_items"):
            # Drop any existing CHECK constraint on status (old native_enum=False creates one)
            op.execute(text(
                f"ALTER TABLE {table} DROP CONSTRAINT IF EXISTS ck_{table}_status"
            ))
            # Also handle the naming pattern Alembic sometimes uses
            op.execute(text(
                f"ALTER TABLE {table} DROP CONSTRAINT IF EXISTS \"{table}_status_check\""
            ))


def downgrade() -> None:
    # Recreate the native enum type
    op.execute(text(
        "CREATE TYPE queue_status_enum AS ENUM "
        "('pending', 'waiting', 'in-progress', 'completed', 'cancelled')"
    ))

    # Convert back to native ENUM
    op.execute(text(
        "ALTER TABLE lab_queue_items "
        "ALTER COLUMN status TYPE queue_status_enum USING status::queue_status_enum"
    ))
    op.execute(text(
        "ALTER TABLE pharmacy_queue_items "
        "ALTER COLUMN status TYPE queue_status_enum USING status::queue_status_enum"
    ))
