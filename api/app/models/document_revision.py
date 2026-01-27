"""DocumentRevision model."""

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.document import Document
    from app.models.revision_batch import RevisionBatch


class ChangeType(str, enum.Enum):
    """Change type enum for document revisions."""

    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    RENAME = "rename"


class DocumentRevision(Base):
    """Document revision for tracking changes."""

    __tablename__ = "document_revisions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    batch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("revision_batches.id", ondelete="CASCADE")
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE")
    )
    change_type: Mapped[ChangeType] = mapped_column(Enum(ChangeType))
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), default=datetime.now
    )

    # Relationships
    batch: Mapped["RevisionBatch"] = relationship(back_populates="revisions")
    document: Mapped["Document"] = relationship(back_populates="revisions")

    __table_args__ = (
        Index("document_revisions_batch_idx", "batch_id"),
        Index("document_revisions_document_idx", "document_id"),
    )
