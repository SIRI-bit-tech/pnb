"""Add missing funding_amount, balance, source_account, approved_at, and activation_delay_hours columns to virtual_cards

Revision ID: f9202611a45b
Revises: 85931b1713bd
Create Date: 2026-09-25 02:42:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f9202611a45b'
down_revision: Union[str, Sequence[str], None] = 'e8bc123e76ae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add virtual card columns if they don't exist using safe Postgres DDL."""
    op.execute("ALTER TABLE virtual_cards ADD COLUMN IF NOT EXISTS funding_amount DOUBLE PRECISION DEFAULT 0.0 NOT NULL;")
    op.execute("ALTER TABLE virtual_cards ADD COLUMN IF NOT EXISTS balance DOUBLE PRECISION DEFAULT 0.0 NOT NULL;")
    op.execute("ALTER TABLE virtual_cards ADD COLUMN IF NOT EXISTS source_account VARCHAR(20) DEFAULT 'checking' NOT NULL;")
    op.execute("ALTER TABLE virtual_cards ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;")
    op.execute("ALTER TABLE virtual_cards ADD COLUMN IF NOT EXISTS activation_delay_hours INTEGER DEFAULT 1 NOT NULL;")


def downgrade() -> None:
    """Remove virtual card columns."""
    op.execute("ALTER TABLE virtual_cards DROP COLUMN IF EXISTS funding_amount;")
    op.execute("ALTER TABLE virtual_cards DROP COLUMN IF EXISTS balance;")
    op.execute("ALTER TABLE virtual_cards DROP COLUMN IF EXISTS source_account;")
    op.execute("ALTER TABLE virtual_cards DROP COLUMN IF EXISTS approved_at;")
    op.execute("ALTER TABLE virtual_cards DROP COLUMN IF EXISTS activation_delay_hours;")
