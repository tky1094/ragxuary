"""Document endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.document import DocumentRepository
from app.repositories.project import ProjectRepository
from app.repositories.revision import RevisionRepository
from app.schemas.document import (
    DocumentPutRequest,
    DocumentRead,
    DocumentRevisionRead,
    DocumentTreeNode,
    RevisionBatchRead,
)
from app.services import (
    DocumentNotFoundError,
    InvalidPathError,
    ParentNotFoundError,
    PermissionDeniedError,
    ProjectNotFoundError,
)
from app.services.document import DocumentService

router = APIRouter(prefix="/projects/{slug}", tags=["documents"])


def get_document_service(db: AsyncSession = Depends(get_db)) -> DocumentService:
    """Dependency to get DocumentService instance.

    Args:
        db: Database session.

    Returns:
        DocumentService instance with repositories.
    """
    return DocumentService(
        DocumentRepository(db),
        RevisionRepository(db),
        ProjectRepository(db),
    )


@router.get("/docs", response_model=list[DocumentTreeNode])
async def get_document_tree(
    slug: Annotated[str, Path(description="Project slug")],
    current_user: Annotated[User, Depends(get_current_active_user)],
    document_service: Annotated[DocumentService, Depends(get_document_service)],
) -> list[DocumentTreeNode]:
    """Get document tree for a project.

    Args:
        slug: The project slug.
        current_user: The authenticated user.
        document_service: Document service.

    Returns:
        List of root-level document tree nodes.
    """
    try:
        return await document_service.get_document_tree(slug, current_user.id)
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


# NOTE: This route must be defined BEFORE /docs/{path:path} to avoid the
# catch-all path parameter from matching /history suffix as part of the path.
@router.get("/docs/{path:path}/history", response_model=list[DocumentRevisionRead])
async def get_document_history(
    slug: Annotated[str, Path(description="Project slug")],
    path: Annotated[str, Path(description="Document path")],
    current_user: Annotated[User, Depends(get_current_active_user)],
    document_service: Annotated[DocumentService, Depends(get_document_service)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[DocumentRevisionRead]:
    """Get document revision history.

    Args:
        slug: The project slug.
        path: Document path.
        current_user: The authenticated user.
        document_service: Document service.
        skip: Number of records to skip (pagination).
        limit: Maximum number of records to return.

    Returns:
        List of document revisions.
    """
    try:
        return await document_service.get_document_history(
            slug, path, current_user.id, skip=skip, limit=limit
        )
    except ProjectNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except DocumentNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except PermissionDeniedError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e


@router.get("/docs/{path:path}", response_model=DocumentRead)
async def get_document(
    slug: Annotated[str, Path(description="Project slug")],
    path: Annotated[str, Path(description="Document path")],
    current_user: Annotated[User, Depends(get_current_active_user)],
    document_service: Annotated[DocumentService, Depends(get_document_service)],
) -> DocumentRead:
    """Get document by path.

    Args:
        slug: The project slug.
        path: Document path.
        current_user: The authenticated user.
        document_service: Document service.

    Returns:
        The document.
    """
    try:
        document = await document_service.get_document(slug, path, current_user.id)
        return DocumentRead.model_validate(document)
    except ProjectNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except DocumentNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except PermissionDeniedError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e


@router.put(
    "/docs/{path:path}",
    response_model=DocumentRead,
    status_code=status.HTTP_200_OK,
)
async def put_document(
    slug: Annotated[str, Path(description="Project slug")],
    path: Annotated[str, Path(description="Document path")],
    request: DocumentPutRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    document_service: Annotated[DocumentService, Depends(get_document_service)],
) -> DocumentRead:
    """Create or update document.

    Args:
        slug: The project slug.
        path: Document path.
        request: Document data.
        current_user: The authenticated user.
        document_service: Document service.

    Returns:
        The created or updated document.
    """
    try:
        document = await document_service.put_document(
            slug, path, request, current_user.id
        )
        return DocumentRead.model_validate(document)
    except ProjectNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except ParentNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except InvalidPathError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except PermissionDeniedError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e


@router.delete("/docs/{path:path}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    slug: Annotated[str, Path(description="Project slug")],
    path: Annotated[str, Path(description="Document path")],
    current_user: Annotated[User, Depends(get_current_active_user)],
    document_service: Annotated[DocumentService, Depends(get_document_service)],
    message: Annotated[str | None, Query(max_length=500)] = None,
) -> None:
    """Delete document.

    Args:
        slug: The project slug.
        path: Document path.
        current_user: The authenticated user.
        document_service: Document service.
        message: Optional delete message.
    """
    try:
        await document_service.delete_document(slug, path, current_user.id, message)
    except ProjectNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except DocumentNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except PermissionDeniedError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e


@router.get("/activity", response_model=list[RevisionBatchRead])
async def get_project_activity(
    slug: Annotated[str, Path(description="Project slug")],
    current_user: Annotated[User, Depends(get_current_active_user)],
    document_service: Annotated[DocumentService, Depends(get_document_service)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[RevisionBatchRead]:
    """Get project activity feed.

    Args:
        slug: The project slug.
        current_user: The authenticated user.
        document_service: Document service.
        skip: Number of records to skip (pagination).
        limit: Maximum number of records to return.

    Returns:
        List of revision batches with document summaries.
    """
    try:
        return await document_service.get_project_activity(
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
