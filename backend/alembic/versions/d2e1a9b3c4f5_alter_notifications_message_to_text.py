"""Alter notifications message column to text

Revision ID: d2e1a9b3c4f5
Revises: b1c4e92a83f1
Create Date: 2026-09-29 09:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd2e1a9b3c4f5'
down_revision: Union[str, Sequence[str], None] = 'b1c4e92a83f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Alter notifications.message column to TEXT to prevent truncation errors."""
    op.execute("ALTER TABLE notifications ALTER COLUMN message TYPE TEXT;")


def downgrade() -> None:
    """Revert notifications.message column back to VARCHAR(255)."""
    op.execute("ALTER TABLE notifications ALTER COLUMN message TYPE VARCHAR(255);")
