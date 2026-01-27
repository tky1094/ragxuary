"""Revision repository for database operations."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.document_revision import ChangeType, DocumentRevision
from app.models.revision_batch import RevisionBatch


class RevisionRepository:
    """Repository for revision-related database operations."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize the repository with a database session."""
        self.db = db

    async def create_batch(
        self,
        project_id: UUID,
        user_id: UUID | None,
        message: str | None = None,
    ) -> RevisionBatch:
        """Create a new revision batch.

        Args:
            project_id: The project UUID.
            user_id: The user UUID (can be None if user was deleted).
            message: Optional commit message.

        Returns:
            The created revision batch.
        """
        batch = RevisionBatch(
            project_id=project_id,
            user_id=user_id,
            message=message,
        )
        self.db.add(batch)
        await self.db.commit()
        await self.db.refresh(batch)
        return batch

    async def create_revision(
        self,
        batch_id: UUID,
        document_id: UUID,
        change_type: ChangeType,
        title: str,
        content: str | None = None,
    ) -> DocumentRevision:
        """Create a document revision.

        Args:
            batch_id: The revision batch UUID.
            document_id: The document UUID.
            change_type: Type of change (create/update/delete/rename).
            title: Document title at time of revision.
            content: Document content at time of revision (None for delete).

        Returns:
            The created document revision.
        """
        revision = DocumentRevision(
            batch_id=batch_id,
            document_id=document_id,
            change_type=change_type,
            title=title,
            content=content,
        )
        self.db.add(revision)
        await self.db.commit()
        await self.db.refresh(revision)
        return revision

    async def get_project_activity(
        self,
        project_id: UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> list[RevisionBatch]:
        """Get project activity feed (batches with revisions and user info).

        Args:
            project_id: The project UUID.
            skip: Number of records to skip (pagination).
            limit: Maximum number of records to return.

        Returns:
            List of revision batches with related data.
        """
        stmt = (
            select(RevisionBatch)
            .options(
                joinedload(RevisionBatch.user),
                joinedload(RevisionBatch.revisions).joinedload(
                    DocumentRevision.document
                ),
            )
            .where(RevisionBatch.project_id == project_id)
            .order_by(RevisionBatch.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.unique().scalars().all())

    async def get_document_history(
        self,
        document_id: UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> list[DocumentRevision]:
        """Get document revision history.

        Args:
            document_id: The document UUID.
            skip: Number of records to skip (pagination).
            limit: Maximum number of records to return.

        Returns:
            List of document revisions.
        """
        stmt = (
            select(DocumentRevision)
            .options(joinedload(DocumentRevision.batch).joinedload(RevisionBatch.user))
            .where(DocumentRevision.document_id == document_id)
            .order_by(DocumentRevision.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.unique().scalars().all())

    async def get_revision_by_id(self, revision_id: UUID) -> DocumentRevision | None:
        """Get a specific revision by ID.

        Args:
            revision_id: The revision UUID.

        Returns:
            The revision if found, None otherwise.
        """
        stmt = (
            select(DocumentRevision)
            .options(joinedload(DocumentRevision.batch).joinedload(RevisionBatch.user))
            .where(DocumentRevision.id == revision_id)
        )
        result = await self.db.execute(stmt)
        return result.unique().scalar_one_or_none()

    async def get_batch_by_id(self, batch_id: UUID) -> RevisionBatch | None:
        """Get a specific batch by ID.

        Args:
            batch_id: The batch UUID.

        Returns:
            The batch if found, None otherwise.
        """
        stmt = (
            select(RevisionBatch)
            .options(
                joinedload(RevisionBatch.user),
                joinedload(RevisionBatch.revisions),
            )
            .where(RevisionBatch.id == batch_id)
        )
        result = await self.db.execute(stmt)
        return result.unique().scalar_one_or_none()
