"""Storage provider interface and implementations."""

import abc
import os
import re
import uuid
from datetime import UTC, datetime
from pathlib import Path

from app.config import settings
from app.services.exceptions import StorageError


class StorageProvider(abc.ABC):
    """Abstract base class for storage providers."""

    @abc.abstractmethod
    async def save(self, content: bytes, filename: str, content_type: str) -> str:
        """Save file and return storage path.

        Args:
            content: File content as bytes.
            filename: Original filename.
            content_type: MIME type of the file.

        Returns:
            Storage path for the saved file.
        """
        ...

    @abc.abstractmethod
    async def get(self, storage_path: str) -> bytes:
        """Get file content by storage path.

        Args:
            storage_path: Path to the stored file.

        Returns:
            File content as bytes.

        Raises:
            StorageError: If file not found or read fails.
        """
        ...

    @abc.abstractmethod
    async def delete(self, storage_path: str) -> None:
        """Delete file by storage path.

        Args:
            storage_path: Path to the stored file.
        """
        ...

    @abc.abstractmethod
    def get_url(self, storage_path: str) -> str:
        """Get URL for accessing the file.

        Args:
            storage_path: Path to the stored file.

        Returns:
            URL to access the file.
        """
        ...


class LocalStorageProvider(StorageProvider):
    """Local filesystem storage provider."""

    def __init__(self, base_path: str | None = None) -> None:
        """Initialize local storage provider.

        Args:
            base_path: Base directory for file storage.
                      Defaults to settings.upload_storage_path.
        """
        self.base_path = Path(base_path or settings.upload_storage_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    async def save(self, content: bytes, filename: str, content_type: str) -> str:
        """Save file to local filesystem.

        Storage path format: {year}/{month}/{uuid}_{sanitized_filename}

        Args:
            content: File content as bytes.
            filename: Original filename.
            content_type: MIME type of the file.

        Returns:
            Relative storage path.
        """
        now = datetime.now(UTC)
        unique_id = uuid.uuid4().hex[:8]
        sanitized = self._sanitize_filename(filename)

        relative_path = f"{now.year}/{now.month:02d}/{unique_id}_{sanitized}"
        full_path = self.base_path / relative_path
        full_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            full_path.write_bytes(content)
        except OSError as e:
            raise StorageError(f"Failed to save file: {e}") from e

        return relative_path

    async def get(self, storage_path: str) -> bytes:
        """Get file content from local filesystem.

        Args:
            storage_path: Relative path to the stored file.

        Returns:
            File content as bytes.

        Raises:
            StorageError: If file not found or read fails.
        """
        full_path = self.base_path / storage_path

        if not full_path.exists():
            raise StorageError(f"File not found: {storage_path}")

        # Prevent path traversal
        try:
            full_path.resolve().relative_to(self.base_path.resolve())
        except ValueError as e:
            raise StorageError("Invalid storage path") from e

        try:
            return full_path.read_bytes()
        except OSError as e:
            raise StorageError(f"Failed to read file: {e}") from e

    async def delete(self, storage_path: str) -> None:
        """Delete file from local filesystem.

        Args:
            storage_path: Relative path to the stored file.
        """
        full_path = self.base_path / storage_path

        # Prevent path traversal
        try:
            full_path.resolve().relative_to(self.base_path.resolve())
        except ValueError:
            return  # Silently ignore invalid paths

        if full_path.exists():
            try:
                full_path.unlink()
            except OSError:
                pass  # Silently ignore deletion errors

    def get_url(self, storage_path: str) -> str:
        """Get URL for local file (served via API endpoint).

        Args:
            storage_path: Relative path to the stored file.

        Returns:
            API URL to access the file.
        """
        return f"/api/v1/uploads/file/{storage_path}"

    def _sanitize_filename(self, filename: str) -> str:
        """Sanitize filename to prevent path traversal and invalid chars.

        Args:
            filename: Original filename.

        Returns:
            Sanitized filename.
        """
        # Remove path components
        filename = os.path.basename(filename)

        # Replace unsafe characters with underscore
        filename = re.sub(r"[^\w.\-]", "_", filename)

        # Limit length
        name, ext = os.path.splitext(filename)
        if len(name) > 100:
            name = name[:100]

        return f"{name}{ext}"


def get_storage_provider() -> StorageProvider:
    """Factory function to get configured storage provider.

    Returns:
        Configured storage provider instance.
    """
    # Future: switch based on settings.storage_type for S3, MinIO, etc.
    return LocalStorageProvider()
