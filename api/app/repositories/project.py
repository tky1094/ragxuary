"""Project repository for database operations."""

from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project, ProjectVisibility
from app.models.project_member import ProjectMember
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectRepository:
    """Repository for project-related database operations."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize the repository with a database session."""
        self.db = db

    async def create(self, project_data: ProjectCreate, owner_id: UUID) -> Project:
        """Create a new project.

        Args:
            project_data: Project creation data.
            owner_id: UUID of the project owner.

        Returns:
            The created project.
        """
        project = Project(
            slug=project_data.slug,
            name=project_data.name,
            description=project_data.description,
            visibility=project_data.visibility,
            owner_id=owner_id,
            git_url=project_data.git_url,
            git_branch=project_data.git_branch,
            git_doc_root=project_data.git_doc_root,
            chat_enabled=project_data.chat_enabled,
        )
        self.db.add(project)
        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def get_by_slug(self, slug: str) -> Project | None:
        """Get a project by slug.

        Args:
            slug: The project slug.

        Returns:
            The project if found, None otherwise.
        """
        stmt = select(Project).where(Project.slug == slug)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id(self, project_id: UUID) -> Project | None:
        """Get a project by ID.

        Args:
            project_id: The UUID of the project.

        Returns:
            The project if found, None otherwise.
        """
        stmt = select(Project).where(Project.id == project_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_owner(
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
        stmt = (
            select(Project)
            .where(Project.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
            .order_by(Project.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def update(self, project: Project, update_data: ProjectUpdate) -> Project:
        """Update a project.

        Args:
            project: The project to update.
            update_data: Update data (partial).

        Returns:
            The updated project.
        """
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(project, field, value)
        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def delete(self, project: Project) -> None:
        """Delete a project.

        Args:
            project: The project to delete.
        """
        await self.db.delete(project)
        await self.db.commit()

    async def slug_exists(self, slug: str) -> bool:
        """Check if a slug already exists.

        Args:
            slug: The slug to check.

        Returns:
            True if slug exists, False otherwise.
        """
        project = await self.get_by_slug(slug)
        return project is not None

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
        # Subquery for projects where user is a member
        member_subquery = select(ProjectMember.project_id).where(
            ProjectMember.user_id == user_id
        )

        stmt = (
            select(Project)
            .where(
                or_(
                    Project.owner_id == user_id,
                    Project.id.in_(member_subquery),
                    Project.visibility == ProjectVisibility.PUBLIC,
                )
            )
            .distinct()
            .offset(skip)
            .limit(limit)
            .order_by(Project.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
