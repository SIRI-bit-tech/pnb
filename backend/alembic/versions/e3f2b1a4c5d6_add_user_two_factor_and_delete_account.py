"""Add user two_factor columns

Revision ID: e3f2b1a4c5d6
Revises: d2e1a9b3c4f5
Create Date: 2026-09-29 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e3f2b1a4c5d6'
down_revision: Union[str, Sequence[str], None] = 'd2e1a9b3c4f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add two_factor_enabled and two_factor_secret columns to users table."""
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(128);")


def downgrade() -> None:
    """Revert two-factor columns."""
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS two_factor_enabled;")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS two_factor_secret;")
