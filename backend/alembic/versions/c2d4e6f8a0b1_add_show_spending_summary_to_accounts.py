"""add show_spending_summary to accounts

Revision ID: c2d4e6f8a0b1
Revises: a7c9d1e2f3b4
Create Date: 2026-11-02 21:10:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'c2d4e6f8a0b1'
down_revision: Union[str, Sequence[str], None] = 'a7c9d1e2f3b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE accounts ADD COLUMN IF NOT EXISTS show_spending_summary BOOLEAN DEFAULT TRUE NOT NULL"
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE accounts DROP COLUMN IF EXISTS show_spending_summary"
    )
