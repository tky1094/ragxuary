"""Tests for UploadService."""

import io
import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import UploadFile

from app.models.upload import Upload
from app.services.exceptions import (
    FileTooLargeError,
    InvalidFileTypeError,
    PermissionDeniedError,
    UploadNotFoundError,
)
from app.services.upload import UploadService


@pytest.fixture
def mock_upload_repo() -> AsyncMock:
    """Create a mock UploadRepository."""
    return AsyncMock()


@pytest.fixture
def mock_storage() -> AsyncMock:
    """Create a mock StorageProvider."""
    storage = AsyncMock()
    storage.get_url = MagicMock(return_value="/api/v1/uploads/file/test/path")
    return storage


@pytest.fixture
def mock_image_processor() -> MagicMock:
    """Create a mock ImageProcessor."""
    processor = MagicMock()
    processor.process.return_value = (io.BytesIO(b"processed"), "image/png", 100)
    return processor


@pytest.fixture
def upload_service(
    mock_upload_repo: AsyncMock,
    mock_storage: AsyncMock,
    mock_image_processor: MagicMock,
) -> UploadService:
    """Create an UploadService with mocked dependencies."""
    return UploadService(
        upload_repo=mock_upload_repo,
        storage=mock_storage,
        image_processor=mock_image_processor,
    )


@pytest.fixture
def sample_upload() -> Upload:
    """Create a sample Upload instance."""
    upload = Upload(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        project_id=uuid.uuid4(),
        filename="test.png",
        storage_path="2026/02/abc123_test.png",
        mime_type="image/png",
        size_bytes=1024,
    )
    upload.created_at = datetime.now(UTC)
    return upload


def create_mock_upload_file(
    content: bytes = b"fake image data",
    filename: str = "test.png",
    content_type: str = "image/png",
    size: int | None = None,
) -> UploadFile:
    """Create a mock UploadFile."""
    file = MagicMock(spec=UploadFile)
    file.filename = filename
    file.content_type = content_type
    file.size = size or len(content)
    file.read = AsyncMock(return_value=content)
    return file


class TestUploadImage:
    """Tests for upload_image method."""

    @pytest.mark.asyncio
    async def test_upload_image_success(
        self,
        upload_service: UploadService,
        mock_upload_repo: AsyncMock,
        mock_storage: AsyncMock,
        sample_upload: Upload,
    ) -> None:
        """Test successful image upload."""
        mock_upload_repo.create.return_value = sample_upload
        mock_storage.save.return_value = "2026/02/abc123_test.png"

        file = create_mock_upload_file()
        user_id = uuid.uuid4()
        project_id = uuid.uuid4()

        with (
            patch.object(upload_service, "_validate_mime_type", return_value=True),
            patch("app.services.upload.settings") as mock_settings,
        ):
            mock_settings.upload_max_file_size = 10 * 1024 * 1024
            mock_settings.upload_allowed_mime_types = ["image/png"]

            result = await upload_service.upload_image(file, user_id, project_id)

        assert result == sample_upload
        mock_upload_repo.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_upload_image_file_too_large_from_header(
        self,
        upload_service: UploadService,
    ) -> None:
        """Test upload fails when file size header exceeds limit."""
        file = create_mock_upload_file(size=20 * 1024 * 1024)  # 20MB

        with patch("app.services.upload.settings") as mock_settings:
            mock_settings.upload_max_file_size = 10 * 1024 * 1024

            with pytest.raises(FileTooLargeError):
                await upload_service.upload_image(file, uuid.uuid4(), uuid.uuid4())

    @pytest.mark.asyncio
    async def test_upload_image_file_too_large_from_content(
        self,
        upload_service: UploadService,
    ) -> None:
        """Test upload fails when actual content exceeds limit."""
        large_content = b"x" * (20 * 1024 * 1024)  # 20MB
        file = create_mock_upload_file(content=large_content, size=None)

        with patch("app.services.upload.settings") as mock_settings:
            mock_settings.upload_max_file_size = 10 * 1024 * 1024

            with pytest.raises(FileTooLargeError):
                await upload_service.upload_image(file, uuid.uuid4(), uuid.uuid4())

    @pytest.mark.asyncio
    async def test_upload_image_invalid_mime_type(
        self,
        upload_service: UploadService,
    ) -> None:
        """Test upload fails with invalid MIME type."""
        file = create_mock_upload_file(content_type="text/plain")

        with (
            patch.object(upload_service, "_validate_mime_type", return_value=False),
            patch("app.services.upload.settings") as mock_settings,
        ):
            mock_settings.upload_max_file_size = 10 * 1024 * 1024

            with pytest.raises(InvalidFileTypeError, match="does not match"):
                await upload_service.upload_image(file, uuid.uuid4(), uuid.uuid4())

    @pytest.mark.asyncio
    async def test_upload_image_disallowed_mime_type(
        self,
        upload_service: UploadService,
    ) -> None:
        """Test upload fails with disallowed MIME type."""
        file = create_mock_upload_file(content_type="image/svg+xml")

        with (
            patch.object(upload_service, "_validate_mime_type", return_value=True),
            patch("app.services.upload.settings") as mock_settings,
        ):
            mock_settings.upload_max_file_size = 10 * 1024 * 1024
            mock_settings.upload_allowed_mime_types = ["image/png", "image/jpeg"]

            with pytest.raises(InvalidFileTypeError, match="not allowed"):
                await upload_service.upload_image(file, uuid.uuid4(), uuid.uuid4())


class TestGetUpload:
    """Tests for get_upload method."""

    @pytest.mark.asyncio
    async def test_get_upload_success(
        self,
        upload_service: UploadService,
        mock_upload_repo: AsyncMock,
        sample_upload: Upload,
    ) -> None:
        """Test successful upload retrieval."""
        mock_upload_repo.get_by_id.return_value = sample_upload

        result = await upload_service.get_upload(sample_upload.id)

        assert result == sample_upload
        mock_upload_repo.get_by_id.assert_called_once_with(sample_upload.id)

    @pytest.mark.asyncio
    async def test_get_upload_not_found(
        self,
        upload_service: UploadService,
        mock_upload_repo: AsyncMock,
    ) -> None:
        """Test get upload raises error when not found."""
        mock_upload_repo.get_by_id.return_value = None
        upload_id = uuid.uuid4()

        with pytest.raises(UploadNotFoundError, match=str(upload_id)):
            await upload_service.get_upload(upload_id)


class TestDeleteUpload:
    """Tests for delete_upload method."""

    @pytest.mark.asyncio
    async def test_delete_upload_success(
        self,
        upload_service: UploadService,
        mock_upload_repo: AsyncMock,
        mock_storage: AsyncMock,
        sample_upload: Upload,
    ) -> None:
        """Test successful upload deletion."""
        mock_upload_repo.get_by_id.return_value = sample_upload

        await upload_service.delete_upload(sample_upload.id, sample_upload.user_id)

        mock_storage.delete.assert_called_once_with(sample_upload.storage_path)
        mock_upload_repo.delete.assert_called_once_with(sample_upload)

    @pytest.mark.asyncio
    async def test_delete_upload_not_owner(
        self,
        upload_service: UploadService,
        mock_upload_repo: AsyncMock,
        sample_upload: Upload,
    ) -> None:
        """Test delete upload fails when user is not owner."""
        mock_upload_repo.get_by_id.return_value = sample_upload
        other_user_id = uuid.uuid4()

        with pytest.raises(PermissionDeniedError):
            await upload_service.delete_upload(sample_upload.id, other_user_id)

    @pytest.mark.asyncio
    async def test_delete_upload_not_found(
        self,
        upload_service: UploadService,
        mock_upload_repo: AsyncMock,
    ) -> None:
        """Test delete upload raises error when not found."""
        mock_upload_repo.get_by_id.return_value = None

        with pytest.raises(UploadNotFoundError):
            await upload_service.delete_upload(uuid.uuid4(), uuid.uuid4())


class TestGetFileContent:
    """Tests for get_file_content method."""

    @pytest.mark.asyncio
    async def test_get_file_content_success(
        self,
        upload_service: UploadService,
        mock_upload_repo: AsyncMock,
        mock_storage: AsyncMock,
        sample_upload: Upload,
    ) -> None:
        """Test successful file content retrieval."""
        mock_upload_repo.get_by_id.return_value = sample_upload
        mock_storage.get.return_value = b"file content"

        content, mime_type = await upload_service.get_file_content(sample_upload.id)

        assert content == b"file content"
        assert mime_type == sample_upload.mime_type
        mock_storage.get.assert_called_once_with(sample_upload.storage_path)


class TestValidateMimeType:
    """Tests for _validate_mime_type method."""

    def test_validate_mime_type_exact_match(
        self,
        upload_service: UploadService,
    ) -> None:
        """Test MIME type validation with exact match."""
        mock_kind = MagicMock()
        mock_kind.mime = "image/png"
        with patch("app.services.upload.filetype") as mock_filetype:
            mock_filetype.guess.return_value = mock_kind

            result = upload_service._validate_mime_type(b"content", "image/png")

            assert result is True

    def test_validate_mime_type_jpeg_variations(
        self,
        upload_service: UploadService,
    ) -> None:
        """Test MIME type validation handles JPEG variations."""
        mock_kind = MagicMock()
        mock_kind.mime = "image/jpeg"
        with patch("app.services.upload.filetype") as mock_filetype:
            mock_filetype.guess.return_value = mock_kind

            # image/jpg should match image/jpeg
            result = upload_service._validate_mime_type(b"content", "image/jpg")

            assert result is True

    def test_validate_mime_type_mismatch(
        self,
        upload_service: UploadService,
    ) -> None:
        """Test MIME type validation rejects mismatch."""
        mock_kind = MagicMock()
        mock_kind.mime = "image/png"
        with patch("app.services.upload.filetype") as mock_filetype:
            mock_filetype.guess.return_value = mock_kind

            result = upload_service._validate_mime_type(b"content", "image/jpeg")

            assert result is False

    def test_validate_mime_type_unknown_file(
        self,
        upload_service: UploadService,
    ) -> None:
        """Test MIME type validation rejects unknown file."""
        with patch("app.services.upload.filetype") as mock_filetype:
            mock_filetype.guess.return_value = None

            result = upload_service._validate_mime_type(b"content", "image/png")

            assert result is False
