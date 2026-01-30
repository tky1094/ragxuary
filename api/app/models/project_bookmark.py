"""Project bookmark model for user bookmarks."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.user import User


class ProjectBookmark(Base):
    """Project bookmark model for user's bookmarked projects.

    This model manages project bookmarks. Bookmarks are private and
    only visible to the user who created them.
    """

    __tablename__ = "project_bookmarks"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="bookmarks")
    project: Mapped["Project"] = relationship(back_populates="bookmarked_by")

    __table_args__ = (Index("project_bookmarks_user_idx", "user_id", "created_at"),)
