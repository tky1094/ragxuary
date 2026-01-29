"""Project member repository for database operations."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.project_member import MemberRole, ProjectMember


class ProjectMemberRepository:
    """Repository for project member database operations."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize the repository with a database session."""
        self.db = db

    async def create(
        self, project_id: UUID, user_id: UUID, role: MemberRole
    ) -> ProjectMember:
        """Add a member to a project.

        Args:
            project_id: UUID of the project.
            user_id: UUID of the user to add.
            role: Role to assign to the member.

        Returns:
            The created project member.
        """
        member = ProjectMember(
            project_id=project_id,
            user_id=user_id,
            role=role,
        )
        self.db.add(member)
        await self.db.commit()
        await self.db.refresh(member)
        return member

    async def get_by_id(self, member_id: UUID) -> ProjectMember | None:
        """Get a project member by ID.

        Args:
            member_id: UUID of the member record.

        Returns:
            The project member if found, None otherwise.
        """
        stmt = select(ProjectMember).where(ProjectMember.id == member_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id_with_user(self, member_id: UUID) -> ProjectMember | None:
        """Get a project member by ID with user details eagerly loaded.

        Args:
            member_id: UUID of the member record.

        Returns:
            The project member with user if found, None otherwise.
        """
        stmt = (
            select(ProjectMember)
            .options(joinedload(ProjectMember.user))
            .where(ProjectMember.id == member_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_project_and_user(
        self, project_id: UUID, user_id: UUID
    ) -> ProjectMember | None:
        """Get a member by project and user.

        Used for:
        - Checking if a user is already a member (duplicate check)
        - Getting membership details for a specific user

        Args:
            project_id: UUID of the project.
            user_id: UUID of the user.

        Returns:
            The project member if found, None otherwise.
        """
        stmt = select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_members_by_project(
        self, project_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[ProjectMember]:
        """Get all members of a project with user details.

        Args:
            project_id: UUID of the project.
            skip: Number of records to skip (pagination).
            limit: Maximum number of records to return.

        Returns:
            List of project members with user details.
        """
        stmt = (
            select(ProjectMember)
            .options(joinedload(ProjectMember.user))
            .where(ProjectMember.project_id == project_id)
            .offset(skip)
            .limit(limit)
            .order_by(ProjectMember.created_at.asc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().unique().all())

    async def get_user_role(self, project_id: UUID, user_id: UUID) -> MemberRole | None:
        """Get user's role in a project.

        Args:
            project_id: UUID of the project.
            user_id: UUID of the user.

        Returns:
            The user's role if they are a member, None otherwise.
        """
        stmt = select(ProjectMember.role).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_role(
        self, member: ProjectMember, role: MemberRole
    ) -> ProjectMember:
        """Update a member's role.

        Args:
            member: The project member to update.
            role: New role to assign.

        Returns:
            The updated project member.
        """
        member.role = role
        await self.db.commit()
        await self.db.refresh(member)
        return member

    async def delete(self, member: ProjectMember) -> None:
        """Remove a member from a project.

        Args:
            member: The project member to remove.
        """
        await self.db.delete(member)
        await self.db.commit()
