"""Project bookmark service for business logic."""

from uuid import UUID

from app.models.project import Project
from app.models.project_bookmark import ProjectBookmark
from app.repositories.project import ProjectRepository
from app.repositories.project_bookmark import ProjectBookmarkRepository
from app.repositories.project_member import ProjectMemberRepository
from app.services.exceptions import PermissionDeniedError, ProjectNotFoundError


class ProjectBookmarkService:
    """Service for project bookmark operations."""

    def __init__(
        self,
        bookmark_repo: ProjectBookmarkRepository,
        project_repo: ProjectRepository,
        member_repo: ProjectMemberRepository,
    ) -> None:
        """Initialize the service with repositories.

        Args:
            bookmark_repo: Repository for bookmark database operations.
            project_repo: Repository for project database operations.
            member_repo: Repository for project member database operations.
        """
        self.bookmark_repo = bookmark_repo
        self.project_repo = project_repo
        self.member_repo = member_repo

    async def _get_project_or_raise(self, slug: str) -> Project:
        """Get a project by slug or raise ProjectNotFoundError.

        Args:
            slug: The project slug.

        Returns:
            The project.

        Raises:
            ProjectNotFoundError: If project is not found.
        """
        project = await self.project_repo.get_by_slug(slug)
        if project is None:
            raise ProjectNotFoundError(f"Project with slug '{slug}' not found")
        return project

    async def _check_access(self, project: Project, user_id: UUID) -> None:
        """Check if user has access to the project.

        Args:
            project: The project to check access for.
            user_id: UUID of the user.

        Raises:
            PermissionDeniedError: If user cannot access the project.
        """
        # Public projects are accessible to everyone
        if project.visibility.value == "public":
            return

        # Owner has access
        if project.owner_id == user_id:
            return

        # Members have access
        member = await self.member_repo.get_by_project_and_user(project.id, user_id)
        if member is not None:
            return

        raise PermissionDeniedError("You do not have access to this project")

    async def add_bookmark(self, slug: str, user_id: UUID) -> ProjectBookmark:
        """Add a bookmark for a project.

        This operation is idempotent - if bookmark already exists,
        returns the existing bookmark.

        Args:
            slug: The project slug.
            user_id: UUID of the user.

        Returns:
            The bookmark (created or existing).

        Raises:
            ProjectNotFoundError: If project is not found.
            PermissionDeniedError: If user cannot access the project.
        """
        project = await self._get_project_or_raise(slug)
        await self._check_access(project, user_id)

        # Check if bookmark already exists (idempotent)
        existing = await self.bookmark_repo.get(user_id, project.id)
        if existing is not None:
            return existing

        return await self.bookmark_repo.create(user_id, project.id)

    async def remove_bookmark(self, slug: str, user_id: UUID) -> bool:
        """Remove a bookmark for a project.

        This operation is idempotent - if bookmark doesn't exist,
        returns False without error.

        Args:
            slug: The project slug.
            user_id: UUID of the user.

        Returns:
            True if bookmark was deleted, False if it didn't exist.

        Raises:
            ProjectNotFoundError: If project is not found.
        """
        project = await self._get_project_or_raise(slug)
        return await self.bookmark_repo.delete(user_id, project.id)

    async def is_bookmarked(self, slug: str, user_id: UUID) -> bool:
        """Check if a project is bookmarked by the user.

        Args:
            slug: The project slug.
            user_id: UUID of the user.

        Returns:
            True if bookmarked, False otherwise.

        Raises:
            ProjectNotFoundError: If project is not found.
        """
        project = await self._get_project_or_raise(slug)
        return await self.bookmark_repo.exists(user_id, project.id)

    async def get_bookmarked_projects(
        self, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[ProjectBookmark]:
        """Get all bookmarked projects for a user.

        Args:
            user_id: UUID of the user.
            skip: Number of records to skip (pagination).
            limit: Maximum number of records to return.

        Returns:
            List of bookmarks with project details.
        """
        return await self.bookmark_repo.get_by_user(user_id, skip, limit)
