"""Upload endpoints."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Path, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.core.storage import get_storage_provider
from app.models.user import User
from app.repositories.project import ProjectRepository
from app.repositories.project_member import ProjectMemberRepository
from app.repositories.upload import UploadRepository
from app.schemas.upload import UploadCreateResponse, UploadRead
from app.services.authorization import Permission, check_project_permission
from app.services.exceptions import (
    FileTooLargeError,
    InvalidFileTypeError,
    PermissionDeniedError,
    StorageError,
    UploadNotFoundError,
)
from app.services.image_processor import ImageProcessor
from app.services.upload import UploadService

router = APIRouter(tags=["uploads"])


def get_upload_service(db: AsyncSession = Depends(get_db)) -> UploadService:
    """Dependency to get UploadService instance.

    Args:
        db: Database session.

    Returns:
        UploadService instance.
    """
    return UploadService(
        upload_repo=UploadRepository(db),
        storage=get_storage_provider(),
        image_processor=ImageProcessor(),
    )


def get_project_repo(db: AsyncSession = Depends(get_db)) -> ProjectRepository:
    """Dependency to get ProjectRepository instance."""
    return ProjectRepository(db)


def get_member_repo(db: AsyncSession = Depends(get_db)) -> ProjectMemberRepository:
    """Dependency to get ProjectMemberRepository instance."""
    return ProjectMemberRepository(db)


@router.post(
    "/projects/{project_id}/uploads",
    response_model=UploadCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_image(
    project_id: Annotated[UUID, Path(description="Project UUID")],
    file: Annotated[UploadFile, File(description="Image file to upload")],
    current_user: Annotated[User, Depends(get_current_active_user)],
    upload_service: Annotated[UploadService, Depends(get_upload_service)],
    project_repo: Annotated[ProjectRepository, Depends(get_project_repo)],
    member_repo: Annotated[ProjectMemberRepository, Depends(get_member_repo)],
) -> UploadCreateResponse:
    """Upload an image to a project.

    Supported formats: PNG, JPEG, GIF, WebP
    Maximum file size: 10MB (configurable)
    Images are automatically resized (max 2048px) and compressed.

    Args:
        project_id: UUID of the project.
        file: Image file to upload.
        current_user: The authenticated user.
        upload_service: Upload service.
        project_repo: Project repository.
        member_repo: Project member repository.

    Returns:
        Upload metadata including URL.

    Raises:
        HTTPException: Various HTTP errors for validation failures.
    """
    # Check project exists
    project = await project_repo.get_by_id(project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Check permission (need EDIT permission to upload)
    has_permission = await check_project_permission(
        project, current_user.id, Permission.EDIT, member_repo
    )
    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to upload to this project",
        )

    try:
        upload = await upload_service.upload_image(
            file=file,
            user_id=current_user.id,
            project_id=project_id,
        )

        return UploadCreateResponse(
            id=upload.id,
            filename=upload.filename,
            mime_type=upload.mime_type,
            size_bytes=upload.size_bytes,
            url=upload_service.get_url(upload),
            created_at=upload.created_at,
        )
    except FileTooLargeError as e:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=str(e),
        ) from e
    except InvalidFileTypeError as e:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=str(e),
        ) from e
    except StorageError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Storage error: {e}",
        ) from e


@router.get("/uploads/{upload_id}", response_model=UploadRead)
async def get_upload(
    upload_id: Annotated[UUID, Path(description="Upload UUID")],
    current_user: Annotated[User, Depends(get_current_active_user)],
    upload_service: Annotated[UploadService, Depends(get_upload_service)],
    project_repo: Annotated[ProjectRepository, Depends(get_project_repo)],
    member_repo: Annotated[ProjectMemberRepository, Depends(get_member_repo)],
) -> UploadRead:
    """Get upload metadata by ID.

    Args:
        upload_id: UUID of the upload.
        current_user: The authenticated user.
        upload_service: Upload service.
        project_repo: Project repository.
        member_repo: Project member repository.

    Returns:
        Upload metadata.

    Raises:
        HTTPException: If upload not found or access denied.
    """
    try:
        upload = await upload_service.get_upload(upload_id)

        # Check project permission if project-specific upload
        if upload.project_id:
            project = await project_repo.get_by_id(upload.project_id)
            if project:
                has_permission = await check_project_permission(
                    project, current_user.id, Permission.VIEW, member_repo
                )
                if not has_permission:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You don't have permission to view this upload",
                    )

        return UploadRead(
            id=upload.id,
            user_id=upload.user_id,
            project_id=upload.project_id,
            filename=upload.filename,
            mime_type=upload.mime_type,
            size_bytes=upload.size_bytes,
            created_at=upload.created_at,
            url=upload_service.get_url(upload),
        )
    except UploadNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


@router.delete("/uploads/{upload_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_upload(
    upload_id: Annotated[UUID, Path(description="Upload UUID")],
    current_user: Annotated[User, Depends(get_current_active_user)],
    upload_service: Annotated[UploadService, Depends(get_upload_service)],
) -> None:
    """Delete an upload.

    Only the uploader can delete their uploads.

    Args:
        upload_id: UUID of the upload to delete.
        current_user: The authenticated user.
        upload_service: Upload service.

    Raises:
        HTTPException: If upload not found or permission denied.
    """
    try:
        await upload_service.delete_upload(upload_id, current_user.id)
    except UploadNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except PermissionDeniedError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e


@router.get("/uploads/file/{storage_path:path}")
async def serve_file(
    storage_path: Annotated[str, Path(description="Storage path of the file")],
    upload_service: Annotated[UploadService, Depends(get_upload_service)],
) -> Response:
    """Serve uploaded file content.

    Note: In production, this should be handled by a CDN or reverse proxy
    for better performance.

    Args:
        storage_path: Storage path of the file.
        upload_service: Upload service.

    Returns:
        File content as HTTP response.

    Raises:
        HTTPException: If file not found.
    """
    try:
        content, mime_type = await upload_service.get_file_content_by_path(storage_path)

        return Response(
            content=content,
            media_type=mime_type,
            headers={
                "Cache-Control": "public, max-age=31536000",  # 1 year cache
            },
        )
    except UploadNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        ) from e
    except StorageError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        ) from e
