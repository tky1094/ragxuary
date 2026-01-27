"""RevisionBatch model."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.document_revision import DocumentRevision
    from app.models.project import Project
    from app.models.user import User


class RevisionBatch(Base):
    """Revision batch for grouping multiple document updates."""

    __tablename__ = "revision_batches"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE")
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="revision_batches")
    user: Mapped["User | None"] = relationship(back_populates="revision_batches")
    revisions: Mapped[list["DocumentRevision"]] = relationship(back_populates="batch")

    __table_args__ = (
        Index("revision_batches_project_idx", "project_id", "created_at"),
        Index("revision_batches_user_idx", "user_id", "created_at"),
    )
