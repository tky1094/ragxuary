"""create_document_revisions_table

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-01-27 10:02:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c3d4e5f6a7b8"
down_revision: str | None = "b2c3d4e5f6a7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create document_revisions table."""
    # Create enum type for change_type
    changetype_enum = sa.Enum(
        "create", "update", "delete", "rename", name="changetype", create_type=False
    )
    changetype_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "document_revisions",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("batch_id", UUID(as_uuid=True), nullable=False),
        sa.Column("document_id", UUID(as_uuid=True), nullable=False),
        sa.Column("change_type", changetype_enum, nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["batch_id"],
            ["revision_batches.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["document_id"],
            ["documents.id"],
            ondelete="CASCADE",
        ),
    )

    # Create indexes
    op.create_index(
        "document_revisions_batch_idx",
        "document_revisions",
        ["batch_id"],
    )
    op.create_index(
        "document_revisions_document_idx",
        "document_revisions",
        ["document_id"],
    )


def downgrade() -> None:
    """Drop document_revisions table."""
    op.drop_index("document_revisions_document_idx", table_name="document_revisions")
    op.drop_index("document_revisions_batch_idx", table_name="document_revisions")
    op.drop_table("document_revisions")

    # Drop enum type
    sa.Enum(name="changetype").drop(op.get_bind(), checkfirst=True)
