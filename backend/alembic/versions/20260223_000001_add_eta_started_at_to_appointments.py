"""Add eta_started_at column to appointments table

Revision ID: add_eta_started_at
Revises: med_code_spec_constraint
Create Date: 2026-02-23 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_eta_started_at'
down_revision: Union[str, None] = 'med_code_spec_constraint'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('appointments', sa.Column(
        'eta_started_at',
        sa.String(50),
        nullable=True,
        comment='Timestamp when ETA calculation was last performed (ISO format)',
    ))


def downgrade() -> None:
    op.drop_column('appointments', 'eta_started_at')
