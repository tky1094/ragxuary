"""Project member endpoints."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.project import ProjectRepository
from app.repositories.project_member import ProjectMemberRepository
from app.repositories.user import UserRepository
from app.schemas.project_member import (
    ProjectMemberCreate,
    ProjectMemberRead,
    ProjectMemberUpdate,
    ProjectMemberWithUserRead,
)
from app.services import (
    CannotModifyOwnerError,
    CannotModifySelfError,
    MemberAlreadyExistsError,
    MemberNotFoundError,
    PermissionDeniedError,
    ProjectMemberService,
    ProjectNotFoundError,
    UserNotFoundError,
)

router = APIRouter(prefix="/projects/{slug}/members", tags=["project-members"])


def get_member_service(db: AsyncSession = Depends(get_db)) -> ProjectMemberService:
    """Dependency to get ProjectMemberService instance.

    Args:
        db: Database session.

    Returns:
        ProjectMemberService instance with repositories.
    """
    return ProjectMemberService(
        ProjectMemberRepository(db),
        ProjectRepository(db),
        UserRepository(db),
    )


@router.get("", response_model=list[ProjectMemberWithUserRead])
async def list_members(
    slug: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    member_service: Annotated[ProjectMemberService, Depends(get_member_service)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
) -> list[ProjectMemberWithUserRead]:
    """List all members of a project.

    All project members (viewer+) can view the member list.

    Args:
        slug: The project slug.
        current_user: The authenticated user.
        member_service: Project member service.
        skip: Number of records to skip (pagination).
        limit: Maximum number of records to return.

    Returns:
        List of project members with user details.
    """
    try:
        return await member_service.list_members(
            slug, current_user.id, skip=skip, limit=limit
        )
    except ProjectNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except PermissionDeniedError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e


@router.post("", response_model=ProjectMemberRead, status_code=status.HTTP_201_CREATED)
async def add_member(
    slug: str,
    request: ProjectMemberCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    member_service: Annotated[ProjectMemberService, Depends(get_member_service)],
) -> ProjectMemberRead:
    """Add a member to a project.

    Only project admins and owners can add members.

    Args:
        slug: The project slug.
        request: Member creation data.
        current_user: The authenticated user.
        member_service: Project member service.

    Returns:
        The created project member.
    """
    try:
        member = await member_service.add_member(
            slug, request.user_id, request.role, current_user.id
        )
        return ProjectMemberRead.model_validate(member)
    except ProjectNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except PermissionDeniedError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except CannotModifyOwnerError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except MemberAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        ) from e


@router.patch("/{member_id}", response_model=ProjectMemberRead)
async def update_member_role(
    slug: str,
    member_id: UUID,
    request: ProjectMemberUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    member_service: Annotated[ProjectMemberService, Depends(get_member_service)],
) -> ProjectMemberRead:
    """Update a member's role.

    Only project admins and owners can update roles.
    Admins cannot modify their own role.

    Args:
        slug: The project slug.
        member_id: UUID of the member record.
        request: Member update data.
        current_user: The authenticated user.
        member_service: Project member service.

    Returns:
        The updated project member.
    """
    try:
        member = await member_service.update_member_role(
            slug, member_id, request.role, current_user.id
        )
        return ProjectMemberRead.model_validate(member)
    except ProjectNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except PermissionDeniedError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e
    except MemberNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except CannotModifySelfError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    slug: str,
    member_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    member_service: Annotated[ProjectMemberService, Depends(get_member_service)],
) -> None:
    """Remove a member from a project.

    Only project admins and owners can remove members.
    Members can also remove themselves (leave the project).

    Args:
        slug: The project slug.
        member_id: UUID of the member record.
        current_user: The authenticated user.
        member_service: Project member service.
    """
    try:
        await member_service.remove_member(slug, member_id, current_user.id)
    except ProjectNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except PermissionDeniedError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e
    except MemberNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
