"""standardize_projectvisibility_enum_to_lowercase

Revision ID: a1b2c3d4e5f7
Revises: f6a7b8c9d0e1
Create Date: 2026-02-09 12:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f7"
down_revision: str | None = "f6a7b8c9d0e1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Rename projectvisibility enum values from uppercase to lowercase.

    PostgreSQL does not support removing enum values directly,
    so we recreate the type with lowercase values.
    """
    # 1. Rename old enum type
    op.execute("ALTER TYPE projectvisibility RENAME TO projectvisibility_old")

    # 2. Create new enum type with lowercase values
    op.execute("CREATE TYPE projectvisibility AS ENUM ('public', 'private')")

    # 3. Update column to use new enum type
    op.execute(
        "ALTER TABLE projects "
        "ALTER COLUMN visibility TYPE projectvisibility "
        "USING LOWER(visibility::text)::projectvisibility"
    )

    # 4. Drop old enum type
    op.execute("DROP TYPE projectvisibility_old")


def downgrade() -> None:
    """Revert projectvisibility enum values to uppercase."""
    op.execute("ALTER TYPE projectvisibility RENAME TO projectvisibility_old")
    op.execute("CREATE TYPE projectvisibility AS ENUM ('PUBLIC', 'PRIVATE')")
    op.execute(
        "ALTER TABLE projects "
        "ALTER COLUMN visibility TYPE projectvisibility "
        "USING UPPER(visibility::text)::projectvisibility"
    )
    op.execute("DROP TYPE projectvisibility_old")
