"""Upload repository for database operations."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.upload import Upload


class UploadRepository:
    """Repository for upload database operations."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize the repository with a database session."""
        self.db = db

    async def create(
        self,
        user_id: UUID,
        project_id: UUID,
        filename: str,
        storage_path: str,
        mime_type: str,
        size_bytes: int,
    ) -> Upload:
        """Create a new upload record.

        Args:
            user_id: UUID of the uploader.
            project_id: UUID of the project.
            filename: Original filename.
            storage_path: Path where file is stored.
            mime_type: MIME type of the file.
            size_bytes: File size in bytes.

        Returns:
            The created upload record.
        """
        upload = Upload(
            user_id=user_id,
            project_id=project_id,
            filename=filename,
            storage_path=storage_path,
            mime_type=mime_type,
            size_bytes=size_bytes,
        )
        self.db.add(upload)
        await self.db.commit()
        await self.db.refresh(upload)
        return upload

    async def get_by_id(self, upload_id: UUID) -> Upload | None:
        """Get upload by ID.

        Args:
            upload_id: UUID of the upload.

        Returns:
            The upload if found, None otherwise.
        """
        stmt = select(Upload).where(Upload.id == upload_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_storage_path(self, storage_path: str) -> Upload | None:
        """Get upload by storage path.

        Args:
            storage_path: Storage path of the upload.

        Returns:
            The upload if found, None otherwise.
        """
        stmt = select(Upload).where(Upload.storage_path == storage_path)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_project(
        self, project_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[Upload]:
        """Get uploads for a project.

        Args:
            project_id: UUID of the project.
            skip: Number of records to skip (pagination).
            limit: Maximum number of records to return.

        Returns:
            List of uploads for the project.
        """
        stmt = (
            select(Upload)
            .where(Upload.project_id == project_id)
            .offset(skip)
            .limit(limit)
            .order_by(Upload.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_user(
        self, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[Upload]:
        """Get uploads by a user.

        Args:
            user_id: UUID of the user.
            skip: Number of records to skip (pagination).
            limit: Maximum number of records to return.

        Returns:
            List of uploads by the user.
        """
        stmt = (
            select(Upload)
            .where(Upload.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .order_by(Upload.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def delete(self, upload: Upload) -> None:
        """Delete an upload record.

        Args:
            upload: The upload to delete.
        """
        await self.db.delete(upload)
        await self.db.commit()
