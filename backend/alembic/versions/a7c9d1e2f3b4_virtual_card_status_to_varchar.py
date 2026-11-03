"""convert virtual_cards.status from postgres enum to varchar

Revision ID: a7c9d1e2f3b4
Revises: f4a3b2c1d5e6
Create Date: 2026-10-21 11:10:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a7c9d1e2f3b4'
down_revision: Union[str, Sequence[str], None] = 'f4a3b2c1d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # The model declares status as String(20) holding lowercase values
    # ("pending", "processing", "completed", "rejected"), but the initial
    # schema created it as a Postgres ENUM ("cardstatus") with uppercase labels,
    # so inserts failed with DatatypeMismatchError. Convert to VARCHAR safely.
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'virtual_cards'
                  AND column_name = 'status'
                  AND udt_name = 'cardstatus'
            ) THEN
                ALTER TABLE virtual_cards ALTER COLUMN status DROP DEFAULT;
                ALTER TABLE virtual_cards
                    ALTER COLUMN status TYPE VARCHAR(20) USING lower(status::text);
            END IF;
        END $$;
        """
    )
    op.execute("DROP TYPE IF EXISTS cardstatus")


def downgrade() -> None:
    # Intentionally a no-op: the VARCHAR column is the intended schema.
    pass
