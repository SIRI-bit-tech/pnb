"""add_external_transfer_columns

Revision ID: b971e7f0e810
Revises: c88240565948
Create Date: 2026-07-14 01:46:39.293585

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b971e7f0e810'
down_revision: Union[str, Sequence[str], None] = 'c88240565948'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('transactions', sa.Column('external_bank_name', sa.String(length=100), nullable=True))
    op.add_column('transactions', sa.Column('external_account_number', sa.String(length=50), nullable=True))
    op.add_column('transactions', sa.Column('fee', sa.Numeric(precision=19, scale=4), server_default="0.0000", nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('transactions', 'fee')
    op.drop_column('transactions', 'external_account_number')
    op.drop_column('transactions', 'external_bank_name')
