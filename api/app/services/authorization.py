"""Authorization helper for project access control."""

from enum import Enum
from uuid import UUID

from app.models.project import Project
from app.models.project_member import MemberRole
from app.repositories.project_member import ProjectMemberRepository


class Permission(str, Enum):
    """Permission types for project access."""

    VIEW = "view"
    EDIT = "edit"
    MANAGE_MEMBERS = "manage_members"
    MANAGE_SETTINGS = "manage_settings"
    DELETE_PROJECT = "delete_project"


# Permission matrix: which permissions each role has
ROLE_PERMISSIONS: dict[MemberRole, set[Permission]] = {
    MemberRole.VIEWER: {Permission.VIEW},
    MemberRole.EDITOR: {Permission.VIEW, Permission.EDIT},
    MemberRole.ADMIN: {Permission.VIEW, Permission.EDIT, Permission.MANAGE_MEMBERS},
}

# Owner has all permissions
OWNER_PERMISSIONS: set[Permission] = {
    Permission.VIEW,
    Permission.EDIT,
    Permission.MANAGE_MEMBERS,
    Permission.MANAGE_SETTINGS,
    Permission.DELETE_PROJECT,
}


async def check_project_permission(
    project: Project,
    user_id: UUID,
    permission: Permission,
    member_repo: ProjectMemberRepository,
) -> bool:
    """Check if a user has a specific permission on a project.

    Permission check order:
    1. Owner has all permissions
    2. Public projects allow view access to everyone
    3. Check member role permissions

    Args:
        project: The project to check access for.
        user_id: UUID of the user.
        permission: The required permission.
        member_repo: Project member repository instance.

    Returns:
        True if user has the permission, False otherwise.
    """
    # Owner has all permissions
    if project.owner_id == user_id:
        return True

    # Public projects allow view access to everyone
    if permission == Permission.VIEW and project.visibility.value == "public":
        return True

    # Check member role
    role = await member_repo.get_user_role(project.id, user_id)
    if role is None:
        return False

    role_permissions = ROLE_PERMISSIONS.get(role, set())
    return permission in role_permissions


async def get_user_permissions(
    project: Project,
    user_id: UUID,
    member_repo: ProjectMemberRepository,
) -> set[Permission]:
    """Get all permissions a user has on a project.

    Args:
        project: The project to check.
        user_id: UUID of the user.
        member_repo: Project member repository instance.

    Returns:
        Set of permissions the user has.
    """
    # Owner has all permissions
    if project.owner_id == user_id:
        return OWNER_PERMISSIONS.copy()

    permissions: set[Permission] = set()

    # Public projects allow view access
    if project.visibility.value == "public":
        permissions.add(Permission.VIEW)

    # Check member role
    role = await member_repo.get_user_role(project.id, user_id)
    if role is not None:
        permissions.update(ROLE_PERMISSIONS.get(role, set()))

    return permissions
