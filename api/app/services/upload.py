"""Upload service for business logic."""

import io
from uuid import UUID

import filetype
from fastapi import UploadFile

from app.config import settings
from app.core.storage import StorageProvider
from app.models.upload import Upload
from app.repositories.upload import UploadRepository
from app.services.exceptions import (
    FileTooLargeError,
    InvalidFileTypeError,
    PermissionDeniedError,
    UploadNotFoundError,
)
from app.services.image_processor import ImageProcessor


class UploadService:
    """Service for upload operations."""

    def __init__(
        self,
        upload_repo: UploadRepository,
        storage: StorageProvider,
        image_processor: ImageProcessor,
    ) -> None:
        """Initialize upload service.

        Args:
            upload_repo: Upload repository for database operations.
            storage: Storage provider for file operations.
            image_processor: Image processor for resize/compress.
        """
        self.upload_repo = upload_repo
        self.storage = storage
        self.image_processor = image_processor

    async def upload_image(
        self,
        file: UploadFile,
        user_id: UUID,
        project_id: UUID,
    ) -> Upload:
        """Upload and process an image.

        Validation flow:
        1. Check file size (before reading full content)
        2. Read content and validate MIME type via magic bytes
        3. Process image (resize, compress)
        4. Save to storage
        5. Create DB record

        Args:
            file: Uploaded file.
            user_id: UUID of the uploader.
            project_id: UUID of the project.

        Returns:
            Created upload record.

        Raises:
            FileTooLargeError: If file exceeds size limit.
            InvalidFileTypeError: If file type is not allowed.
            StorageError: If storage operation fails.
        """
        # 1. Check content-length header if available
        if file.size and file.size > settings.upload_max_file_size:
            raise FileTooLargeError(
                f"File exceeds maximum size of {settings.upload_max_file_size} bytes"
            )

        # 2. Read and validate content
        content = await file.read()

        if len(content) > settings.upload_max_file_size:
            raise FileTooLargeError(
                f"File exceeds maximum size of {settings.upload_max_file_size} bytes"
            )

        # Validate MIME type using magic bytes
        claimed_mime = file.content_type or "application/octet-stream"
        if not self._validate_mime_type(content, claimed_mime):
            raise InvalidFileTypeError("File content does not match declared MIME type")

        if claimed_mime not in settings.upload_allowed_mime_types:
            raise InvalidFileTypeError(f"File type {claimed_mime} is not allowed")

        # 3. Process image
        file_buffer = io.BytesIO(content)
        processed_file, processed_mime, processed_size = self.image_processor.process(
            file_buffer, claimed_mime
        )

        # 4. Save to storage
        storage_path = await self.storage.save(
            processed_file.read(),
            file.filename or "unnamed",
            processed_mime,
        )

        # 5. Create DB record
        upload = await self.upload_repo.create(
            user_id=user_id,
            project_id=project_id,
            filename=file.filename or "unnamed",
            storage_path=storage_path,
            mime_type=processed_mime,
            size_bytes=processed_size,
        )

        return upload

    async def get_upload(self, upload_id: UUID) -> Upload:
        """Get upload by ID.

        Args:
            upload_id: UUID of the upload.

        Returns:
            Upload record.

        Raises:
            UploadNotFoundError: If upload not found.
        """
        upload = await self.upload_repo.get_by_id(upload_id)
        if upload is None:
            raise UploadNotFoundError(f"Upload {upload_id} not found")
        return upload

    async def get_upload_by_storage_path(self, storage_path: str) -> Upload:
        """Get upload by storage path.

        Args:
            storage_path: Storage path of the upload.

        Returns:
            Upload record.

        Raises:
            UploadNotFoundError: If upload not found.
        """
        upload = await self.upload_repo.get_by_storage_path(storage_path)
        if upload is None:
            raise UploadNotFoundError(f"Upload not found for path: {storage_path}")
        return upload

    async def delete_upload(self, upload_id: UUID, user_id: UUID) -> None:
        """Delete upload (must be owner).

        Args:
            upload_id: UUID of the upload to delete.
            user_id: UUID of the user requesting deletion.

        Raises:
            UploadNotFoundError: If upload not found.
            PermissionDeniedError: If user is not the owner.
        """
        upload = await self.get_upload(upload_id)

        # Check permission - only owner can delete
        if upload.user_id != user_id:
            raise PermissionDeniedError(
                "You don't have permission to delete this upload"
            )

        # Delete from storage
        await self.storage.delete(upload.storage_path)

        # Delete DB record
        await self.upload_repo.delete(upload)

    async def get_file_content(self, upload_id: UUID) -> tuple[bytes, str]:
        """Get file content for serving.

        Args:
            upload_id: UUID of the upload.

        Returns:
            Tuple of (file content bytes, mime type).

        Raises:
            UploadNotFoundError: If upload not found.
            StorageError: If file retrieval fails.
        """
        upload = await self.get_upload(upload_id)
        content = await self.storage.get(upload.storage_path)
        return content, upload.mime_type

    async def get_file_content_by_path(self, storage_path: str) -> tuple[bytes, str]:
        """Get file content by storage path.

        Args:
            storage_path: Storage path of the file.

        Returns:
            Tuple of (file content bytes, mime type).

        Raises:
            UploadNotFoundError: If upload not found.
            StorageError: If file retrieval fails.
        """
        upload = await self.get_upload_by_storage_path(storage_path)
        content = await self.storage.get(upload.storage_path)
        return content, upload.mime_type

    def _validate_mime_type(self, content: bytes, claimed_mime: str) -> bool:
        """Validate file content matches claimed MIME type using magic bytes.

        Args:
            content: File content bytes.
            claimed_mime: MIME type claimed by the client.

        Returns:
            True if valid, False otherwise.
        """
        # Use filetype for robust detection
        kind = filetype.guess(content)
        if kind is None:
            return False

        detected = kind.mime

        # Normalize for comparison
        normalized_claimed = claimed_mime.lower()
        normalized_detected = detected.lower()

        # Exact match
        if normalized_claimed == normalized_detected:
            return True

        # Handle JPEG variations
        jpeg_types = {"image/jpeg", "image/jpg", "image/pjpeg"}
        if normalized_claimed in jpeg_types and normalized_detected in jpeg_types:
            return True

        return False

    def get_url(self, upload: Upload) -> str:
        """Get URL for an upload.

        Args:
            upload: Upload record.

        Returns:
            URL to access the file.
        """
        return self.storage.get_url(upload.storage_path)
