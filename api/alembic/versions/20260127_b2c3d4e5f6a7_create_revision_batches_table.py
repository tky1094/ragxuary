"""create_revision_batches_table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-01-27 10:01:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: str | None = "a1b2c3d4e5f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create revision_batches table."""
    op.create_table(
        "revision_batches",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=True),
        sa.Column("message", sa.String(length=500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
    )

    # Create indexes with DESC for created_at
    op.create_index(
        "revision_batches_project_idx",
        "revision_batches",
        ["project_id", sa.text("created_at DESC")],
    )
    op.create_index(
        "revision_batches_user_idx",
        "revision_batches",
        ["user_id", sa.text("created_at DESC")],
    )


def downgrade() -> None:
    """Drop revision_batches table."""
    op.drop_index("revision_batches_user_idx", table_name="revision_batches")
    op.drop_index("revision_batches_project_idx", table_name="revision_batches")
    op.drop_table("revision_batches")
