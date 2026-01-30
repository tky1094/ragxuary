"""Project model."""

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.document import Document
    from app.models.project_bookmark import ProjectBookmark
    from app.models.project_member import ProjectMember
    from app.models.revision_batch import RevisionBatch
    from app.models.user import User


class ProjectVisibility(str, enum.Enum):
    """Project visibility enum."""

    PUBLIC = "public"
    PRIVATE = "private"


class Project(Base):
    """Project model for documentation projects."""

    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    visibility: Mapped[ProjectVisibility] = mapped_column(
        Enum(ProjectVisibility), default=ProjectVisibility.PRIVATE
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    git_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    git_branch: Mapped[str | None] = mapped_column(String(100), nullable=True)
    git_doc_root: Mapped[str | None] = mapped_column(String(200), nullable=True)
    chat_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    owner: Mapped["User"] = relationship(back_populates="projects")
    documents: Mapped[list["Document"]] = relationship(back_populates="project")
    revision_batches: Mapped[list["RevisionBatch"]] = relationship(
        back_populates="project"
    )
    members: Mapped[list["ProjectMember"]] = relationship(back_populates="project")
    bookmarked_by: Mapped[list["ProjectBookmark"]] = relationship(
        back_populates="project"
    )
