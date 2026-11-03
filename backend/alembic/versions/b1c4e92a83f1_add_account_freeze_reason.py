"""Add freeze_reason to accounts table

Revision ID: b1c4e92a83f1
Revises: a8491c2b5e7d
Create Date: 2026-09-25 04:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1c4e92a83f1'
down_revision: Union[str, Sequence[str], None] = 'a8491c2b5e7d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add freeze_reason column to accounts table if not exists."""
    op.execute("ALTER TABLE accounts ADD COLUMN IF NOT EXISTS freeze_reason VARCHAR(1000);")


def downgrade() -> None:
    """Drop freeze_reason column from accounts table."""
    op.execute("ALTER TABLE accounts DROP COLUMN IF EXISTS freeze_reason;")
