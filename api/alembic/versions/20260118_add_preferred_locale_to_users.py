"""add_preferred_locale_to_users

Revision ID: 7f3a8b2c1d4e
Revises: 382d1adc3c37
Create Date: 2026-01-18

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "7f3a8b2c1d4e"
down_revision: str | None = "382d1adc3c37"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade database schema."""
    op.add_column(
        "users",
        sa.Column(
            "preferred_locale",
            sa.String(length=10),
            nullable=True,
            comment="Preferred language (ja/en)",
        ),
    )


def downgrade() -> None:
    """Downgrade database schema."""
    op.drop_column("users", "preferred_locale")
