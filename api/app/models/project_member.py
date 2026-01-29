"""Project member model for access control."""

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Index, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.user import User


class MemberRole(str, enum.Enum):
    """Project member role enum."""

    VIEWER = "viewer"
    EDITOR = "editor"
    ADMIN = "admin"


class ProjectMember(Base):
    """Project member model for role-based access control.

    This model manages project membership with role-based permissions.
    Currently supports user-based membership only.

    TODO: Add group_id column for group-based membership when groups table is implemented.
          - Add group_id: Mapped[uuid.UUID | None] with FK to groups.id
          - Add CHECK constraint: (group_id IS NOT NULL AND user_id IS NULL) OR
                                  (group_id IS NULL AND user_id IS NOT NULL)
          - Add partial unique index on (project_id, group_id) WHERE group_id IS NOT NULL
          - Update user_id to be nullable
    """

    __tablename__ = "project_members"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    role: Mapped[MemberRole] = mapped_column(Enum(MemberRole))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship(back_populates="project_memberships")

    __table_args__ = (
        Index("project_members_project_user_key", "project_id", "user_id", unique=True),
    )
