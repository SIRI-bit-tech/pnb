"""Add support category and support messages table

Revision ID: f4a3b2c1d5e6
Revises: e3f2b1a4c5d6
Create Date: 2026-09-29 11:35:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4a3b2c1d5e6'
down_revision: Union[str, Sequence[str], None] = 'e3f2b1a4c5d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add category to support_tickets and create support_messages table."""
    op.execute("ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS category VARCHAR(100);")
    op.execute("""
        CREATE TABLE IF NOT EXISTS support_messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
            sender_type VARCHAR(20) NOT NULL,
            sender_name VARCHAR(100) NOT NULL,
            content TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_support_messages_ticket_id ON support_messages (ticket_id);")


def downgrade() -> None:
    """Revert support messages table and ticket category."""
    op.execute("DROP TABLE IF EXISTS support_messages;")
    op.execute("ALTER TABLE support_tickets DROP COLUMN IF EXISTS category;")
