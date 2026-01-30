"""Project bookmark repository for database operations."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.project_bookmark import ProjectBookmark


class ProjectBookmarkRepository:
    """Repository for project bookmark database operations."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize the repository with a database session."""
        self.db = db

    async def create(self, user_id: UUID, project_id: UUID) -> ProjectBookmark:
        """Create a bookmark.

        Args:
            user_id: UUID of the user.
            project_id: UUID of the project to bookmark.

        Returns:
            The created bookmark.
        """
        bookmark = ProjectBookmark(
            user_id=user_id,
            project_id=project_id,
        )
        self.db.add(bookmark)
        await self.db.commit()
        await self.db.refresh(bookmark)
        return bookmark

    async def delete(self, user_id: UUID, project_id: UUID) -> bool:
        """Delete a bookmark.

        Args:
            user_id: UUID of the user.
            project_id: UUID of the project.

        Returns:
            True if deleted, False if bookmark didn't exist.
        """
        bookmark = await self.get(user_id, project_id)
        if bookmark is None:
            return False
        await self.db.delete(bookmark)
        await self.db.commit()
        return True

    async def get(self, user_id: UUID, project_id: UUID) -> ProjectBookmark | None:
        """Get a bookmark by user and project.

        Args:
            user_id: UUID of the user.
            project_id: UUID of the project.

        Returns:
            The bookmark if found, None otherwise.
        """
        stmt = select(ProjectBookmark).where(
            ProjectBookmark.user_id == user_id,
            ProjectBookmark.project_id == project_id,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def exists(self, user_id: UUID, project_id: UUID) -> bool:
        """Check if a bookmark exists.

        Args:
            user_id: UUID of the user.
            project_id: UUID of the project.

        Returns:
            True if bookmark exists, False otherwise.
        """
        bookmark = await self.get(user_id, project_id)
        return bookmark is not None

    async def get_by_user(
        self, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[ProjectBookmark]:
        """Get all bookmarks for a user with project details.

        Args:
            user_id: UUID of the user.
            skip: Number of records to skip (pagination).
            limit: Maximum number of records to return.

        Returns:
            List of bookmarks with project details.
        """
        stmt = (
            select(ProjectBookmark)
            .options(joinedload(ProjectBookmark.project))
            .where(ProjectBookmark.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .order_by(ProjectBookmark.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().unique().all())
