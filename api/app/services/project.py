"""Project service for business logic."""

from uuid import UUID

from app.models.project import Project
from app.repositories.project import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services.exceptions import (
    PermissionDeniedError,
    ProjectNotFoundError,
    SlugAlreadyExistsError,
)


class ProjectService:
    """Service for project operations."""

    def __init__(self, project_repo: ProjectRepository) -> None:
        """Initialize the service with a project repository.

        Args:
            project_repo: Repository for project database operations.
        """
        self.project_repo = project_repo

    async def create_project(
        self, project_data: ProjectCreate, owner_id: UUID
    ) -> Project:
        """Create a new project.

        Args:
            project_data: Project creation data.
            owner_id: UUID of the project owner.

        Returns:
            The created project.

        Raises:
            SlugAlreadyExistsError: If slug is already taken.
        """
        if await self.project_repo.slug_exists(project_data.slug):
            raise SlugAlreadyExistsError(
                f"Project with slug '{project_data.slug}' already exists"
            )

        return await self.project_repo.create(project_data, owner_id)

    async def get_project_by_slug(self, slug: str) -> Project:
        """Get a project by slug.

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

    async def get_projects_by_owner(
        self, owner_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[Project]:
        """Get all projects owned by a user.

        Args:
            owner_id: The UUID of the owner.
            skip: Number of records to skip (pagination).
            limit: Maximum number of records to return.

        Returns:
            List of projects owned by the user.
        """
        return await self.project_repo.get_by_owner(owner_id, skip, limit)

    async def get_accessible_projects(
        self, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[Project]:
        """Get all projects accessible by a user.

        Includes:
        - Projects owned by the user
        - Projects where user is a member
        - Public projects

        Args:
            user_id: The UUID of the user.
            skip: Number of records to skip (pagination).
            limit: Maximum number of records to return.

        Returns:
            List of accessible projects.
        """
        return await self.project_repo.get_accessible_projects(user_id, skip, limit)

    async def update_project(
        self, slug: str, update_data: ProjectUpdate, user_id: UUID
    ) -> Project:
        """Update a project.

        Args:
            slug: The project slug.
            update_data: Update data (partial).
            user_id: UUID of the requesting user.

        Returns:
            The updated project.

        Raises:
            ProjectNotFoundError: If project is not found.
            PermissionDeniedError: If user is not the owner.
        """
        project = await self.project_repo.get_by_slug(slug)
        if project is None:
            raise ProjectNotFoundError(f"Project with slug '{slug}' not found")

        if project.owner_id != user_id:
            raise PermissionDeniedError(
                "Only the project owner can update this project"
            )

        return await self.project_repo.update(project, update_data)

    async def delete_project(self, slug: str, user_id: UUID) -> None:
        """Delete a project.

        Args:
            slug: The project slug.
            user_id: UUID of the requesting user.

        Raises:
            ProjectNotFoundError: If project is not found.
            PermissionDeniedError: If user is not the owner.
        """
        project = await self.project_repo.get_by_slug(slug)
        if project is None:
            raise ProjectNotFoundError(f"Project with slug '{slug}' not found")

        if project.owner_id != user_id:
            raise PermissionDeniedError(
                "Only the project owner can delete this project"
            )

        await self.project_repo.delete(project)
