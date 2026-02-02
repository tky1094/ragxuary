"""Tests for setup service."""

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.repositories.user import UserRepository
from app.services.exceptions import EmailAlreadyExistsError, SetupAlreadyCompletedError
from app.services.setup import SetupService


class TestSetupServiceGetStatus:
    """Tests for SetupService.get_status method."""

    @pytest.fixture
    def mock_user_repo(self) -> MagicMock:
        """Create a mock user repository."""
        return MagicMock(spec=UserRepository)

    @pytest.fixture
    def setup_service(self, mock_user_repo: MagicMock) -> SetupService:
        """Create a SetupService instance with mock repository."""
        return SetupService(mock_user_repo)

    @pytest.mark.asyncio
    async def test_get_status_requires_admin(
        self, setup_service: SetupService, mock_user_repo: MagicMock
    ) -> None:
        """Test status when no admin exists."""
        mock_user_repo.admin_exists = AsyncMock(return_value=False)

        result = await setup_service.get_status()

        assert result["is_setup_completed"] is False
        assert result["requires_admin"] is True
        mock_user_repo.admin_exists.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_status_completed(
        self, setup_service: SetupService, mock_user_repo: MagicMock
    ) -> None:
        """Test status when admin exists."""
        mock_user_repo.admin_exists = AsyncMock(return_value=True)

        result = await setup_service.get_status()

        assert result["is_setup_completed"] is True
        assert result["requires_admin"] is False
        mock_user_repo.admin_exists.assert_called_once()


class TestSetupServiceCreateAdmin:
    """Tests for SetupService.create_admin method."""

    @pytest.fixture
    def mock_user_repo(self) -> MagicMock:
        """Create a mock user repository."""
        return MagicMock(spec=UserRepository)

    @pytest.fixture
    def setup_service(self, mock_user_repo: MagicMock) -> SetupService:
        """Create a SetupService instance with mock repository."""
        return SetupService(mock_user_repo)

    @pytest.mark.asyncio
    async def test_create_admin_success(
        self, setup_service: SetupService, mock_user_repo: MagicMock
    ) -> None:
        """Test successful admin creation."""
        user_id = uuid4()
        mock_user = MagicMock()
        mock_user.id = user_id

        mock_user_repo.admin_exists = AsyncMock(return_value=False)
        mock_user_repo.email_exists = AsyncMock(return_value=False)
        mock_user_repo.create_admin = AsyncMock(return_value=mock_user)

        with patch("app.services.setup.hash_password", return_value="hashed_password"):
            result = await setup_service.create_admin(
                email="admin@example.com",
                name="Admin User",
                password="AdminPass123",
            )

        assert result.access_token is not None
        assert result.refresh_token is not None
        mock_user_repo.admin_exists.assert_called_once()
        mock_user_repo.email_exists.assert_called_once_with("admin@example.com")
        mock_user_repo.create_admin.assert_called_once_with(
            "admin@example.com",
            "Admin User",
            "hashed_password",
        )

    @pytest.mark.asyncio
    async def test_create_admin_setup_already_completed(
        self, setup_service: SetupService, mock_user_repo: MagicMock
    ) -> None:
        """Test admin creation fails when setup is already completed."""
        mock_user_repo.admin_exists = AsyncMock(return_value=True)

        with pytest.raises(
            SetupAlreadyCompletedError, match="Setup has already been completed"
        ):
            await setup_service.create_admin(
                email="admin@example.com",
                name="Admin User",
                password="AdminPass123",
            )

        mock_user_repo.email_exists.assert_not_called()
        mock_user_repo.create_admin.assert_not_called()

    @pytest.mark.asyncio
    async def test_create_admin_email_already_exists(
        self, setup_service: SetupService, mock_user_repo: MagicMock
    ) -> None:
        """Test admin creation fails when email already exists."""
        mock_user_repo.admin_exists = AsyncMock(return_value=False)
        mock_user_repo.email_exists = AsyncMock(return_value=True)

        with pytest.raises(EmailAlreadyExistsError, match="Email"):
            await setup_service.create_admin(
                email="existing@example.com",
                name="Admin User",
                password="AdminPass123",
            )

        mock_user_repo.create_admin.assert_not_called()
