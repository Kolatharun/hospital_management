"""Add announcement tracking columns to appointments table

Revision ID: add_announcement_tracking
Revises: add_eta_started_at
Create Date: 2026-02-23 00:00:02.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_announcement_tracking'
down_revision: Union[str, None] = 'add_eta_started_at'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('appointments', sa.Column(
        'announcement_played',
        sa.Boolean(),
        nullable=False,
        server_default='false',
        comment='Whether the TV announcement has been played for this patient',
    ))
    op.add_column('appointments', sa.Column(
        'announcement_played_at',
        sa.String(50),
        nullable=True,
        comment='When the announcement was played (ISO format)',
    ))


def downgrade() -> None:
    op.drop_column('appointments', 'announcement_played_at')
    op.drop_column('appointments', 'announcement_played')
