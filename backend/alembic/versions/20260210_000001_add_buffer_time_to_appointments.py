"""Add buffer_time_minutes column to appointments table

Revision ID: add_buffer_time
Revises: add_lab_columns
Create Date: 2026-02-10 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_buffer_time'
down_revision: Union[str, None] = 'add_lab_columns'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('appointments', sa.Column(
        'buffer_time_minutes',
        sa.Integer(),
        nullable=True,
        server_default='0',
        comment='Extra buffer time added to this patient consultation slot',
    ))


def downgrade() -> None:
    op.drop_column('appointments', 'buffer_time_minutes')
