"""create_project_members_table

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-01-29 10:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM, UUID

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d4e5f6a7b8c9"
down_revision: str | None = "c3d4e5f6a7b8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create project_members table for role-based access control."""
    # Create enum type for member role using raw SQL
    op.execute("CREATE TYPE memberrole AS ENUM ('viewer', 'editor', 'admin')")

    # Reference the existing enum type
    memberrole_enum = ENUM(
        "viewer", "editor", "admin", name="memberrole", create_type=False
    )

    op.create_table(
        "project_members",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("role", memberrole_enum, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
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
            ondelete="CASCADE",
        ),
    )

    # Create unique index on (project_id, user_id)
    op.create_index(
        "project_members_project_user_key",
        "project_members",
        ["project_id", "user_id"],
        unique=True,
    )

    # Create index on project_id for faster lookups
    op.create_index(
        "project_members_project_idx",
        "project_members",
        ["project_id"],
    )


def downgrade() -> None:
    """Drop project_members table."""
    op.drop_index("project_members_project_idx", table_name="project_members")
    op.drop_index("project_members_project_user_key", table_name="project_members")
    op.drop_table("project_members")

    # Drop enum type using raw SQL
    op.execute("DROP TYPE IF EXISTS memberrole")
