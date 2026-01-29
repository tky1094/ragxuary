"""Project member service for business logic."""

from uuid import UUID

from app.models.project import Project
from app.models.project_member import MemberRole, ProjectMember
from app.repositories.project import ProjectRepository
from app.repositories.project_member import ProjectMemberRepository
from app.repositories.user import UserRepository
from app.schemas.project_member import ProjectMemberWithUserRead
from app.services.authorization import Permission, check_project_permission
from app.services.exceptions import (
    CannotModifyOwnerError,
    CannotModifySelfError,
    MemberAlreadyExistsError,
    MemberNotFoundError,
    PermissionDeniedError,
    ProjectNotFoundError,
    UserNotFoundError,
)


class ProjectMemberService:
    """Service for project member operations."""

    def __init__(
        self,
        member_repo: ProjectMemberRepository,
        project_repo: ProjectRepository,
        user_repo: UserRepository,
    ) -> None:
        """Initialize the service with repositories.

        Args:
            member_repo: Repository for project member database operations.
            project_repo: Repository for project database operations.
            user_repo: Repository for user database operations.
        """
        self.member_repo = member_repo
        self.project_repo = project_repo
        self.user_repo = user_repo

    async def list_members(
        self,
        project_slug: str,
        requesting_user_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[ProjectMemberWithUserRead]:
        """List project members.

        All members (viewer+) can list other members.

        Args:
            project_slug: The project slug.
            requesting_user_id: UUID of the requesting user.
            skip: Number of records to skip (pagination).
            limit: Maximum number of records to return.

        Returns:
            List of project members with user details.

        Raises:
            ProjectNotFoundError: If project is not found.
            PermissionDeniedError: If user does not have view access.
        """
        project = await self._get_project_with_view_permission(
            project_slug, requesting_user_id
        )

        members = await self.member_repo.get_members_by_project(
            project.id, skip=skip, limit=limit
        )

        return [ProjectMemberWithUserRead.from_member(m) for m in members]

    async def add_member(
        self,
        project_slug: str,
        user_id: UUID,
        role: MemberRole,
        requesting_user_id: UUID,
    ) -> ProjectMember:
        """Add a member to a project.

        Only admin and owner can add members.

        Args:
            project_slug: The project slug.
            user_id: UUID of the user to add.
            role: Role to assign to the member.
            requesting_user_id: UUID of the requesting user.

        Returns:
            The created project member.

        Raises:
            ProjectNotFoundError: If project is not found.
            PermissionDeniedError: If user does not have manage_members permission.
            UserNotFoundError: If the target user does not exist.
            CannotModifyOwnerError: If trying to add the owner as a member.
            MemberAlreadyExistsError: If user is already a member.
        """
        project = await self._get_project_with_manage_permission(
            project_slug, requesting_user_id
        )

        # Check if target user exists
        target_user = await self.user_repo.get_by_id(user_id)
        if target_user is None:
            raise UserNotFoundError(f"User with ID '{user_id}' not found")

        # Cannot add owner as a member
        if project.owner_id == user_id:
            raise CannotModifyOwnerError(
                "Cannot add project owner as a member. Owner already has full access."
            )

        # Check if user is already a member
        existing = await self.member_repo.get_by_project_and_user(project.id, user_id)
        if existing is not None:
            raise MemberAlreadyExistsError(
                f"User is already a member of this project with role '{existing.role.value}'"
            )

        return await self.member_repo.create(project.id, user_id, role)

    async def update_member_role(
        self,
        project_slug: str,
        member_id: UUID,
        new_role: MemberRole,
        requesting_user_id: UUID,
    ) -> ProjectMember:
        """Update a member's role.

        Only admin and owner can update roles.
        Admins cannot modify their own role (to prevent self-lockout).

        Args:
            project_slug: The project slug.
            member_id: UUID of the member record.
            new_role: New role to assign.
            requesting_user_id: UUID of the requesting user.

        Returns:
            The updated project member.

        Raises:
            ProjectNotFoundError: If project is not found.
            PermissionDeniedError: If user does not have manage_members permission.
            MemberNotFoundError: If member is not found.
            CannotModifySelfError: If admin tries to modify their own role.
        """
        project = await self._get_project_with_manage_permission(
            project_slug, requesting_user_id
        )

        member = await self.member_repo.get_by_id(member_id)
        if member is None or member.project_id != project.id:
            raise MemberNotFoundError(f"Member with ID '{member_id}' not found")

        # Admin cannot modify their own role (owner can)
        is_owner = project.owner_id == requesting_user_id
        if not is_owner and member.user_id == requesting_user_id:
            raise CannotModifySelfError(
                "You cannot modify your own role. "
                "Ask the project owner or another admin."
            )

        return await self.member_repo.update_role(member, new_role)

    async def remove_member(
        self,
        project_slug: str,
        member_id: UUID,
        requesting_user_id: UUID,
    ) -> None:
        """Remove a member from a project.

        Only admin and owner can remove members.
        Members can also remove themselves (leave the project).

        Args:
            project_slug: The project slug.
            member_id: UUID of the member record.
            requesting_user_id: UUID of the requesting user.

        Raises:
            ProjectNotFoundError: If project is not found.
            PermissionDeniedError: If user does not have permission.
            MemberNotFoundError: If member is not found.
        """
        project = await self._get_project(project_slug)

        member = await self.member_repo.get_by_id(member_id)
        if member is None or member.project_id != project.id:
            raise MemberNotFoundError(f"Member with ID '{member_id}' not found")

        # Allow self-removal (leaving the project)
        is_self_removal = member.user_id == requesting_user_id

        if not is_self_removal:
            # Check manage_members permission for removing others
            has_permission = await check_project_permission(
                project, requesting_user_id, Permission.MANAGE_MEMBERS, self.member_repo
            )
            if not has_permission:
                raise PermissionDeniedError(
                    "You do not have permission to remove members from this project"
                )

        await self.member_repo.delete(member)

    # --- Helper methods ---

    async def _get_project(self, project_slug: str) -> Project:
        """Get project by slug.

        Args:
            project_slug: The project slug.

        Returns:
            The project.

        Raises:
            ProjectNotFoundError: If project is not found.
        """
        project = await self.project_repo.get_by_slug(project_slug)
        if project is None:
            raise ProjectNotFoundError(f"Project with slug '{project_slug}' not found")
        return project

    async def _get_project_with_view_permission(
        self, project_slug: str, user_id: UUID
    ) -> Project:
        """Get project and validate view permission.

        Args:
            project_slug: The project slug.
            user_id: UUID of the user.

        Returns:
            The project.

        Raises:
            ProjectNotFoundError: If project is not found.
            PermissionDeniedError: If user does not have view access.
        """
        project = await self._get_project(project_slug)

        has_permission = await check_project_permission(
            project, user_id, Permission.VIEW, self.member_repo
        )
        if not has_permission:
            raise PermissionDeniedError(
                "You do not have permission to view this project"
            )

        return project

    async def _get_project_with_manage_permission(
        self, project_slug: str, user_id: UUID
    ) -> Project:
        """Get project and validate manage_members permission.

        Args:
            project_slug: The project slug.
            user_id: UUID of the user.

        Returns:
            The project.

        Raises:
            ProjectNotFoundError: If project is not found.
            PermissionDeniedError: If user does not have manage_members permission.
        """
        project = await self._get_project(project_slug)

        has_permission = await check_project_permission(
            project, user_id, Permission.MANAGE_MEMBERS, self.member_repo
        )
        if not has_permission:
            raise PermissionDeniedError(
                "You do not have permission to manage members in this project"
            )

        return project
