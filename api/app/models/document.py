"""Document model."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.document_revision import DocumentRevision
    from app.models.project import Project


class Document(Base):
    """Document model for project documentation with hierarchy support."""

    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE")
    )
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=True,
    )
    slug: Mapped[str] = mapped_column(String(200))
    path: Mapped[str] = mapped_column(String(500))
    index: Mapped[int] = mapped_column(Integer, default=0)
    is_folder: Mapped[bool] = mapped_column(Boolean, default=False)
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="documents")
    parent: Mapped["Document | None"] = relationship(
        back_populates="children",
        remote_side=[id],
        foreign_keys=[parent_id],
    )
    children: Mapped[list["Document"]] = relationship(
        back_populates="parent",
        foreign_keys=[parent_id],
        passive_deletes=True,
    )
    revisions: Mapped[list["DocumentRevision"]] = relationship(
        back_populates="document",
        passive_deletes=True,
    )

    __table_args__ = (
        UniqueConstraint("project_id", "path", name="documents_project_path_key"),
        UniqueConstraint(
            "project_id", "parent_id", "slug", name="documents_parent_slug_key"
        ),
        Index("documents_project_parent_idx", "project_id", "parent_id", "index"),
    )
