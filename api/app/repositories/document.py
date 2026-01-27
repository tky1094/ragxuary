"""Document repository for database operations."""

from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document


class DocumentRepository:
    """Repository for document-related database operations."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize the repository with a database session."""
        self.db = db

    async def create(
        self,
        project_id: UUID,
        slug: str,
        path: str,
        title: str,
        content: str | None = None,
        parent_id: UUID | None = None,
        is_folder: bool = False,
        index: int = 0,
    ) -> Document:
        """Create a new document.

        Args:
            project_id: The project UUID.
            slug: Document slug.
            path: Full document path.
            title: Document title.
            content: Document content (None for folders).
            parent_id: Parent document UUID (None for root).
            is_folder: Whether this is a folder.
            index: Sort order within siblings.

        Returns:
            The created document.
        """
        document = Document(
            project_id=project_id,
            slug=slug,
            path=path,
            title=title,
            content=content,
            parent_id=parent_id,
            is_folder=is_folder,
            index=index,
        )
        self.db.add(document)
        await self.db.commit()
        await self.db.refresh(document)
        return document

    async def get_by_id(self, document_id: UUID) -> Document | None:
        """Get document by ID.

        Args:
            document_id: The document UUID.

        Returns:
            The document if found, None otherwise.
        """
        stmt = select(Document).where(Document.id == document_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_path(self, project_id: UUID, path: str) -> Document | None:
        """Get document by project ID and path.

        Args:
            project_id: The project UUID.
            path: Document path.

        Returns:
            The document if found, None otherwise.
        """
        stmt = select(Document).where(
            and_(Document.project_id == project_id, Document.path == path)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_by_project(self, project_id: UUID) -> list[Document]:
        """Get all documents for a project (for tree building).

        Args:
            project_id: The project UUID.

        Returns:
            List of all documents in the project.
        """
        stmt = (
            select(Document)
            .where(Document.project_id == project_id)
            .order_by(Document.parent_id.nulls_first(), Document.index)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_children(
        self, project_id: UUID, parent_id: UUID | None
    ) -> list[Document]:
        """Get child documents of a parent.

        Args:
            project_id: The project UUID.
            parent_id: Parent document UUID (None for root level).

        Returns:
            List of child documents.
        """
        if parent_id is None:
            stmt = (
                select(Document)
                .where(
                    and_(
                        Document.project_id == project_id,
                        Document.parent_id.is_(None),
                    )
                )
                .order_by(Document.index)
            )
        else:
            stmt = (
                select(Document)
                .where(
                    and_(
                        Document.project_id == project_id,
                        Document.parent_id == parent_id,
                    )
                )
                .order_by(Document.index)
            )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def update(
        self,
        document: Document,
        title: str | None = None,
        content: str | None = None,
    ) -> Document:
        """Update a document.

        Args:
            document: The document to update.
            title: New title (optional).
            content: New content (optional).

        Returns:
            The updated document.
        """
        if title is not None:
            document.title = title
        if content is not None:
            document.content = content
        await self.db.commit()
        await self.db.refresh(document)
        return document

    async def delete(self, document: Document) -> None:
        """Delete a document (and descendants via CASCADE).

        Args:
            document: The document to delete.
        """
        await self.db.delete(document)
        await self.db.commit()

    async def path_exists(self, project_id: UUID, path: str) -> bool:
        """Check if path exists in project.

        Args:
            project_id: The project UUID.
            path: Document path.

        Returns:
            True if path exists, False otherwise.
        """
        document = await self.get_by_path(project_id, path)
        return document is not None

    async def get_max_index(self, project_id: UUID, parent_id: UUID | None) -> int:
        """Get max index for sibling order.

        Args:
            project_id: The project UUID.
            parent_id: Parent document UUID (None for root level).

        Returns:
            Maximum index value, or -1 if no siblings exist.
        """
        if parent_id is None:
            stmt = select(func.max(Document.index)).where(
                and_(
                    Document.project_id == project_id,
                    Document.parent_id.is_(None),
                )
            )
        else:
            stmt = select(func.max(Document.index)).where(
                and_(
                    Document.project_id == project_id,
                    Document.parent_id == parent_id,
                )
            )
        result = await self.db.execute(stmt)
        max_index = result.scalar_one_or_none()
        return max_index if max_index is not None else -1

    async def get_parent_by_path(
        self, project_id: UUID, parent_path: str
    ) -> Document | None:
        """Get parent document by path.

        Args:
            project_id: The project UUID.
            parent_path: Parent document path.

        Returns:
            The parent document if found, None otherwise.
        """
        return await self.get_by_path(project_id, parent_path)
