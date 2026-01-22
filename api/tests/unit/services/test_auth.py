"""Tests for authentication service."""

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.repositories.user import UserRepository
from app.services import (
    AuthService,
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    InvalidTokenError,
    UserInactiveError,
)


class TestAuthServiceRegister:
    """Tests for AuthService.register method."""

    @pytest.fixture
    def mock_user_repo(self) -> MagicMock:
        """Create a mock user repository."""
        return MagicMock(spec=UserRepository)

    @pytest.fixture
    def auth_service(self, mock_user_repo: MagicMock) -> AuthService:
        """Create an AuthService instance with mock repository."""
        return AuthService(mock_user_repo)

    @pytest.mark.asyncio
    async def test_register_success(
        self, auth_service: AuthService, mock_user_repo: MagicMock
    ) -> None:
        """Test successful user registration."""
        user_id = uuid4()
        mock_user = MagicMock()
        mock_user.id = user_id

        mock_user_repo.email_exists = AsyncMock(return_value=False)
        mock_user_repo.create = AsyncMock(return_value=mock_user)

        with patch("app.services.auth.hash_password", return_value="hashed_password"):
            result = await auth_service.register(
                email="test@example.com",
                name="Test User",
                password="TestPassword123",
            )

        assert result.access_token is not None
        assert result.refresh_token is not None
        mock_user_repo.email_exists.assert_called_once_with("test@example.com")
        mock_user_repo.create.assert_called_once_with(
            email="test@example.com",
            name="Test User",
            password_hash="hashed_password",
            auth_provider="local",
        )

    @pytest.mark.asyncio
    async def test_register_email_already_exists(
        self, auth_service: AuthService, mock_user_repo: MagicMock
    ) -> None:
        """Test registration fails when email already exists."""
        mock_user_repo.email_exists = AsyncMock(return_value=True)

        with pytest.raises(EmailAlreadyExistsError, match="Email already registered"):
            await auth_service.register(
                email="existing@example.com",
                name="Test User",
                password="TestPassword123",
            )

        mock_user_repo.create.assert_not_called()


class TestAuthServiceLogin:
    """Tests for AuthService.login method."""

    @pytest.fixture
    def mock_user_repo(self) -> MagicMock:
        """Create a mock user repository."""
        return MagicMock(spec=UserRepository)

    @pytest.fixture
    def auth_service(self, mock_user_repo: MagicMock) -> AuthService:
        """Create an AuthService instance with mock repository."""
        return AuthService(mock_user_repo)

    @pytest.mark.asyncio
    async def test_login_success(
        self, auth_service: AuthService, mock_user_repo: MagicMock
    ) -> None:
        """Test successful login."""
        user_id = uuid4()
        mock_user = MagicMock()
        mock_user.id = user_id
        mock_user.password_hash = "hashed_password"
        mock_user.is_active = True

        mock_user_repo.get_by_email = AsyncMock(return_value=mock_user)

        with patch("app.services.auth.verify_password", return_value=True):
            result = await auth_service.login(
                email="test@example.com",
                password="TestPassword123",
            )

        assert result.access_token is not None
        assert result.refresh_token is not None
        mock_user_repo.get_by_email.assert_called_once_with("test@example.com")

    @pytest.mark.asyncio
    async def test_login_user_not_found(
        self, auth_service: AuthService, mock_user_repo: MagicMock
    ) -> None:
        """Test login fails when user is not found."""
        mock_user_repo.get_by_email = AsyncMock(return_value=None)

        with pytest.raises(InvalidCredentialsError, match="Invalid email or password"):
            await auth_service.login(
                email="nonexistent@example.com",
                password="TestPassword123",
            )

    @pytest.mark.asyncio
    async def test_login_wrong_password(
        self, auth_service: AuthService, mock_user_repo: MagicMock
    ) -> None:
        """Test login fails with wrong password."""
        mock_user = MagicMock()
        mock_user.password_hash = "hashed_password"
        mock_user.is_active = True

        mock_user_repo.get_by_email = AsyncMock(return_value=mock_user)

        with (
            patch("app.services.auth.verify_password", return_value=False),
            pytest.raises(InvalidCredentialsError, match="Invalid email or password"),
        ):
            await auth_service.login(
                email="test@example.com",
                password="WrongPassword123",
            )

    @pytest.mark.asyncio
    async def test_login_no_password_hash(
        self, auth_service: AuthService, mock_user_repo: MagicMock
    ) -> None:
        """Test login fails when user has no password hash (OAuth user)."""
        mock_user = MagicMock()
        mock_user.password_hash = None
        mock_user.is_active = True

        mock_user_repo.get_by_email = AsyncMock(return_value=mock_user)

        with pytest.raises(InvalidCredentialsError, match="Invalid email or password"):
            await auth_service.login(
                email="oauth@example.com",
                password="TestPassword123",
            )

    @pytest.mark.asyncio
    async def test_login_inactive_user(
        self, auth_service: AuthService, mock_user_repo: MagicMock
    ) -> None:
        """Test login fails when user is inactive."""
        mock_user = MagicMock()
        mock_user.password_hash = "hashed_password"
        mock_user.is_active = False

        mock_user_repo.get_by_email = AsyncMock(return_value=mock_user)

        with (
            patch("app.services.auth.verify_password", return_value=True),
            pytest.raises(UserInactiveError, match="User account is inactive"),
        ):
            await auth_service.login(
                email="inactive@example.com",
                password="TestPassword123",
            )


class TestAuthServiceLogout:
    """Tests for AuthService.logout method."""

    @pytest.fixture
    def mock_user_repo(self) -> MagicMock:
        """Create a mock user repository."""
        return MagicMock(spec=UserRepository)

    @pytest.fixture
    def auth_service(self, mock_user_repo: MagicMock) -> AuthService:
        """Create an AuthService instance with mock repository."""
        return AuthService(mock_user_repo)

    @pytest.mark.asyncio
    async def test_logout_success(self, auth_service: AuthService) -> None:
        """Test successful logout adds token to blacklist."""
        from datetime import UTC, datetime, timedelta

        mock_payload = MagicMock()
        mock_payload.exp = datetime.now(UTC) + timedelta(hours=1)

        with (
            patch("app.services.auth.decode_token", return_value=mock_payload),
            patch(
                "app.services.auth.add_token_to_blacklist", new_callable=AsyncMock
            ) as mock_blacklist,
        ):
            await auth_service.logout("valid_token")

        mock_blacklist.assert_called_once()

    @pytest.mark.asyncio
    async def test_logout_invalid_token(self, auth_service: AuthService) -> None:
        """Test logout with invalid token does nothing."""
        with (
            patch("app.services.auth.decode_token", return_value=None),
            patch(
                "app.services.auth.add_token_to_blacklist", new_callable=AsyncMock
            ) as mock_blacklist,
        ):
            await auth_service.logout("invalid_token")

        mock_blacklist.assert_not_called()

    @pytest.mark.asyncio
    async def test_logout_expired_token(self, auth_service: AuthService) -> None:
        """Test logout with expired token does not add to blacklist."""
        from datetime import UTC, datetime, timedelta

        mock_payload = MagicMock()
        mock_payload.exp = datetime.now(UTC) - timedelta(hours=1)

        with (
            patch("app.services.auth.decode_token", return_value=mock_payload),
            patch(
                "app.services.auth.add_token_to_blacklist", new_callable=AsyncMock
            ) as mock_blacklist,
        ):
            await auth_service.logout("expired_token")

        mock_blacklist.assert_not_called()


class TestAuthServiceRefreshTokens:
    """Tests for AuthService.refresh_tokens method."""

    @pytest.fixture
    def mock_user_repo(self) -> MagicMock:
        """Create a mock user repository."""
        return MagicMock(spec=UserRepository)

    @pytest.fixture
    def auth_service(self, mock_user_repo: MagicMock) -> AuthService:
        """Create an AuthService instance with mock repository."""
        return AuthService(mock_user_repo)

    @pytest.mark.asyncio
    async def test_refresh_tokens_success(
        self, auth_service: AuthService, mock_user_repo: MagicMock
    ) -> None:
        """Test successful token refresh."""
        from datetime import UTC, datetime, timedelta

        user_id = uuid4()
        mock_user = MagicMock()
        mock_user.id = user_id
        mock_user.is_active = True

        mock_payload = MagicMock()
        mock_payload.type = "refresh"
        mock_payload.sub = str(user_id)
        mock_payload.exp = datetime.now(UTC) + timedelta(days=7)

        mock_user_repo.get_by_id = AsyncMock(return_value=mock_user)

        with (
            patch(
                "app.services.auth.is_token_blacklisted",
                new_callable=AsyncMock,
                return_value=False,
            ),
            patch("app.services.auth.decode_token", return_value=mock_payload),
            patch("app.services.auth.add_token_to_blacklist", new_callable=AsyncMock),
        ):
            result = await auth_service.refresh_tokens("valid_refresh_token")

        assert result.access_token is not None
        assert result.refresh_token is not None

    @pytest.mark.asyncio
    async def test_refresh_tokens_blacklisted(self, auth_service: AuthService) -> None:
        """Test refresh fails when token is blacklisted."""
        with (
            patch(
                "app.services.auth.is_token_blacklisted",
                new_callable=AsyncMock,
                return_value=True,
            ),
            pytest.raises(InvalidTokenError, match="Token is blacklisted"),
        ):
            await auth_service.refresh_tokens("blacklisted_token")

    @pytest.mark.asyncio
    async def test_refresh_tokens_invalid_token(
        self, auth_service: AuthService
    ) -> None:
        """Test refresh fails with invalid token."""
        with (
            patch(
                "app.services.auth.is_token_blacklisted",
                new_callable=AsyncMock,
                return_value=False,
            ),
            patch("app.services.auth.decode_token", return_value=None),
            pytest.raises(InvalidTokenError, match="Invalid refresh token"),
        ):
            await auth_service.refresh_tokens("invalid_token")

    @pytest.mark.asyncio
    async def test_refresh_tokens_wrong_token_type(
        self, auth_service: AuthService
    ) -> None:
        """Test refresh fails when token type is not refresh."""
        mock_payload = MagicMock()
        mock_payload.type = "access"

        with (
            patch(
                "app.services.auth.is_token_blacklisted",
                new_callable=AsyncMock,
                return_value=False,
            ),
            patch("app.services.auth.decode_token", return_value=mock_payload),
            pytest.raises(InvalidTokenError, match="Invalid refresh token"),
        ):
            await auth_service.refresh_tokens("access_token_not_refresh")

    @pytest.mark.asyncio
    async def test_refresh_tokens_invalid_user_id(
        self, auth_service: AuthService
    ) -> None:
        """Test refresh fails with invalid user ID in token."""
        from datetime import UTC, datetime, timedelta

        mock_payload = MagicMock()
        mock_payload.type = "refresh"
        mock_payload.sub = "not-a-valid-uuid"
        mock_payload.exp = datetime.now(UTC) + timedelta(days=7)

        with (
            patch(
                "app.services.auth.is_token_blacklisted",
                new_callable=AsyncMock,
                return_value=False,
            ),
            patch("app.services.auth.decode_token", return_value=mock_payload),
            pytest.raises(InvalidTokenError, match="Invalid token payload"),
        ):
            await auth_service.refresh_tokens("token_with_invalid_user_id")

    @pytest.mark.asyncio
    async def test_refresh_tokens_user_not_found(
        self, auth_service: AuthService, mock_user_repo: MagicMock
    ) -> None:
        """Test refresh fails when user is not found."""
        from datetime import UTC, datetime, timedelta

        user_id = uuid4()
        mock_payload = MagicMock()
        mock_payload.type = "refresh"
        mock_payload.sub = str(user_id)
        mock_payload.exp = datetime.now(UTC) + timedelta(days=7)

        mock_user_repo.get_by_id = AsyncMock(return_value=None)

        with (
            patch(
                "app.services.auth.is_token_blacklisted",
                new_callable=AsyncMock,
                return_value=False,
            ),
            patch("app.services.auth.decode_token", return_value=mock_payload),
            pytest.raises(InvalidTokenError, match="User not found or inactive"),
        ):
            await auth_service.refresh_tokens("token_for_deleted_user")

    @pytest.mark.asyncio
    async def test_refresh_tokens_inactive_user(
        self, auth_service: AuthService, mock_user_repo: MagicMock
    ) -> None:
        """Test refresh fails when user is inactive."""
        from datetime import UTC, datetime, timedelta

        user_id = uuid4()
        mock_user = MagicMock()
        mock_user.id = user_id
        mock_user.is_active = False

        mock_payload = MagicMock()
        mock_payload.type = "refresh"
        mock_payload.sub = str(user_id)
        mock_payload.exp = datetime.now(UTC) + timedelta(days=7)

        mock_user_repo.get_by_id = AsyncMock(return_value=mock_user)

        with (
            patch(
                "app.services.auth.is_token_blacklisted",
                new_callable=AsyncMock,
                return_value=False,
            ),
            patch("app.services.auth.decode_token", return_value=mock_payload),
            pytest.raises(InvalidTokenError, match="User not found or inactive"),
        ):
            await auth_service.refresh_tokens("token_for_inactive_user")
