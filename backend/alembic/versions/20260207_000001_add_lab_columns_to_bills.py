"""Add lab_total and lab_and_investigations columns to bills table

Revision ID: add_lab_columns
Revises: 1db140240fad
Create Date: 2026-02-07 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_lab_columns'
down_revision: Union[str, None] = '1db140240fad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add lab_total column to bills table
    op.add_column('bills', sa.Column(
        'lab_total',
        sa.Numeric(precision=10, scale=2),
        nullable=False,
        server_default='0.00',
        comment='Total amount of lab/investigation items'
    ))

    # Add lab_and_investigations column to bills table (JSON text)
    op.add_column('bills', sa.Column(
        'lab_and_investigations',
        sa.Text(),
        nullable=True,
        comment='JSON array of lab items: [{name, amount}]'
    ))


def downgrade() -> None:
    # Remove the columns
    op.drop_column('bills', 'lab_and_investigations')
    op.drop_column('bills', 'lab_total')
