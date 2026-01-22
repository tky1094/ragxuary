"""Project endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.project import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.services import (
    PermissionDeniedError,
    ProjectNotFoundError,
    ProjectService,
    SlugAlreadyExistsError,
)

router = APIRouter(prefix="/projects", tags=["projects"])


def get_project_service(db: AsyncSession = Depends(get_db)) -> ProjectService:
    """Dependency to get ProjectService instance.

    Args:
        db: Database session.

    Returns:
        ProjectService instance with ProjectRepository.
    """
    return ProjectService(ProjectRepository(db))


@router.get("", response_model=list[ProjectRead])
async def list_projects(
    current_user: Annotated[User, Depends(get_current_active_user)],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
) -> list[ProjectRead]:
    """List all projects owned by the current user.

    Args:
        current_user: The authenticated user.
        project_service: Project service.
        skip: Number of records to skip (pagination).
        limit: Maximum number of records to return.

    Returns:
        List of projects owned by the current user.
    """
    projects = await project_service.get_projects_by_owner(
        current_user.id, skip=skip, limit=limit
    )
    return [ProjectRead.model_validate(p) for p in projects]


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(
    request: ProjectCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
) -> ProjectRead:
    """Create a new project.

    Args:
        request: Project creation data.
        current_user: The authenticated user.
        project_service: Project service.

    Returns:
        The created project.

    Raises:
        HTTPException: If slug already exists.
    """
    try:
        project = await project_service.create_project(request, current_user.id)
        return ProjectRead.model_validate(project)
    except SlugAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        ) from e


@router.get("/{slug}", response_model=ProjectRead)
async def get_project(
    slug: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
) -> ProjectRead:
    """Get a project by slug.

    Args:
        slug: The project slug.
        current_user: The authenticated user.
        project_service: Project service.

    Returns:
        The project.

    Raises:
        HTTPException: If project is not found or user is not the owner.
    """
    try:
        project = await project_service.get_project_by_slug(slug)
        # Private projects are only visible to the owner
        if (
            project.visibility.value == "private"
            and project.owner_id != current_user.id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this project",
            )
        return ProjectRead.model_validate(project)
    except ProjectNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


@router.patch("/{slug}", response_model=ProjectRead)
async def update_project(
    slug: str,
    request: ProjectUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
) -> ProjectRead:
    """Update a project.

    Args:
        slug: The project slug.
        request: Project update data.
        current_user: The authenticated user.
        project_service: Project service.

    Returns:
        The updated project.

    Raises:
        HTTPException: If project is not found or user is not the owner.
    """
    try:
        project = await project_service.update_project(slug, request, current_user.id)
        return ProjectRead.model_validate(project)
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


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    slug: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
) -> None:
    """Delete a project.

    Args:
        slug: The project slug.
        current_user: The authenticated user.
        project_service: Project service.

    Raises:
        HTTPException: If project is not found or user is not the owner.
    """
    try:
        await project_service.delete_project(slug, current_user.id)
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
