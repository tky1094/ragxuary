"""Bookmark endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.project import ProjectRepository
from app.repositories.project_bookmark import ProjectBookmarkRepository
from app.repositories.project_member import ProjectMemberRepository
from app.schemas.project_bookmark import (
    BookmarkedProjectRead,
    BookmarkStatusRead,
    ProjectBookmarkRead,
)
from app.services.exceptions import PermissionDeniedError, ProjectNotFoundError
from app.services.project_bookmark import ProjectBookmarkService

router = APIRouter(tags=["bookmarks"])


def get_bookmark_service(db: AsyncSession = Depends(get_db)) -> ProjectBookmarkService:
    """Dependency to get ProjectBookmarkService instance.

    Args:
        db: Database session.

    Returns:
        ProjectBookmarkService instance.
    """
    return ProjectBookmarkService(
        bookmark_repo=ProjectBookmarkRepository(db),
        project_repo=ProjectRepository(db),
        member_repo=ProjectMemberRepository(db),
    )


@router.get("/bookmarks", response_model=list[BookmarkedProjectRead])
async def list_bookmarks(
    current_user: Annotated[User, Depends(get_current_active_user)],
    bookmark_service: Annotated[ProjectBookmarkService, Depends(get_bookmark_service)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
) -> list[BookmarkedProjectRead]:
    """List all bookmarked projects for the current user.

    Args:
        current_user: The authenticated user.
        bookmark_service: Bookmark service.
        skip: Number of records to skip (pagination).
        limit: Maximum number of records to return.

    Returns:
        List of bookmarked projects with details.
    """
    bookmarks = await bookmark_service.get_bookmarked_projects(
        current_user.id, skip=skip, limit=limit
    )
    return [BookmarkedProjectRead.model_validate(b) for b in bookmarks]


@router.post(
    "/projects/{slug}/bookmark",
    response_model=ProjectBookmarkRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_bookmark(
    slug: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    bookmark_service: Annotated[ProjectBookmarkService, Depends(get_bookmark_service)],
) -> ProjectBookmarkRead:
    """Add a bookmark for a project.

    This operation is idempotent - calling it multiple times
    returns the same bookmark without error.

    Args:
        slug: The project slug.
        current_user: The authenticated user.
        bookmark_service: Bookmark service.

    Returns:
        The bookmark.

    Raises:
        HTTPException: If project is not found or user does not have access.
    """
    try:
        bookmark = await bookmark_service.add_bookmark(slug, current_user.id)
        return ProjectBookmarkRead.model_validate(bookmark)
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


@router.delete(
    "/projects/{slug}/bookmark",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_bookmark(
    slug: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    bookmark_service: Annotated[ProjectBookmarkService, Depends(get_bookmark_service)],
) -> None:
    """Remove a bookmark for a project.

    This operation is idempotent - calling it when no bookmark
    exists returns 204 without error.

    Args:
        slug: The project slug.
        current_user: The authenticated user.
        bookmark_service: Bookmark service.

    Raises:
        HTTPException: If project is not found.
    """
    try:
        await bookmark_service.remove_bookmark(slug, current_user.id)
    except ProjectNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


@router.get(
    "/projects/{slug}/bookmark",
    response_model=BookmarkStatusRead,
)
async def get_bookmark_status(
    slug: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    bookmark_service: Annotated[ProjectBookmarkService, Depends(get_bookmark_service)],
) -> BookmarkStatusRead:
    """Check if a project is bookmarked by the current user.

    Args:
        slug: The project slug.
        current_user: The authenticated user.
        bookmark_service: Bookmark service.

    Returns:
        Bookmark status.

    Raises:
        HTTPException: If project is not found.
    """
    try:
        is_bookmarked = await bookmark_service.is_bookmarked(slug, current_user.id)
        return BookmarkStatusRead(is_bookmarked=is_bookmarked)
    except ProjectNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
