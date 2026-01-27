"""create_documents_table

Revision ID: a1b2c3d4e5f6
Revises: 26c7aff739a2
Create Date: 2026-01-27 10:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: str | None = "26c7aff739a2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create documents table."""
    op.create_table(
        "documents",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", UUID(as_uuid=True), nullable=False),
        sa.Column("parent_id", UUID(as_uuid=True), nullable=True),
        sa.Column("slug", sa.String(length=200), nullable=False),
        sa.Column("path", sa.String(length=500), nullable=False),
        sa.Column("index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_folder", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
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
            ["parent_id"],
            ["documents.id"],
            ondelete="CASCADE",
        ),
    )

    # Create unique constraints
    op.create_unique_constraint(
        "documents_project_path_key",
        "documents",
        ["project_id", "path"],
    )
    op.create_unique_constraint(
        "documents_parent_slug_key",
        "documents",
        ["project_id", "parent_id", "slug"],
    )

    # Create indexes
    op.create_index(
        "documents_project_parent_idx",
        "documents",
        ["project_id", "parent_id", "index"],
    )


def downgrade() -> None:
    """Drop documents table."""
    op.drop_index("documents_project_parent_idx", table_name="documents")
    op.drop_constraint("documents_parent_slug_key", "documents", type_="unique")
    op.drop_constraint("documents_project_path_key", "documents", type_="unique")
    op.drop_table("documents")
