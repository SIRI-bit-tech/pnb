"""Add is_approved column to users table

Revision ID: a8491c2b5e7d
Revises: f9202611a45b
Create Date: 2026-09-25 03:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a8491c2b5e7d'
down_revision: Union[str, Sequence[str], None] = 'f9202611a45b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add is_approved column to users table if not exists, defaulting existing users to true."""
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE NOT NULL;")


def downgrade() -> None:
    """Drop is_approved column from users table."""
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS is_approved;")
