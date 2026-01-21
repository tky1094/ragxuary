"""Authentication service for business logic."""

from datetime import UTC, datetime
from uuid import UUID

from app.core.redis import add_token_to_blacklist, is_token_blacklisted
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.repositories.user import UserRepository
from app.schemas.auth import TokenResponse
from app.services.exceptions import (
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    InvalidTokenError,
    UserInactiveError,
)


class AuthService:
    """Service for authentication operations."""

    def __init__(self, user_repo: UserRepository) -> None:
        """Initialize the service with a user repository.

        Args:
            user_repo: Repository for user database operations.
        """
        self.user_repo = user_repo

    async def register(self, email: str, name: str, password: str) -> TokenResponse:
        """Register a new user and return tokens.

        Args:
            email: User's email address.
            name: User's display name.
            password: User's plain text password.

        Returns:
            Access and refresh tokens.

        Raises:
            EmailAlreadyExistsError: If email is already registered.
        """
        if await self.user_repo.email_exists(email):
            raise EmailAlreadyExistsError("Email already registered")

        hashed_password = hash_password(password)
        user = await self.user_repo.create(
            email=email,
            name=name,
            password_hash=hashed_password,
            auth_provider="local",
        )

        return self._generate_tokens(user.id)

    async def login(self, email: str, password: str) -> TokenResponse:
        """Authenticate user and return tokens.

        Args:
            email: User's email address.
            password: User's plain text password.

        Returns:
            Access and refresh tokens.

        Raises:
            InvalidCredentialsError: If email or password is invalid.
            UserInactiveError: If user account is inactive.
        """
        user = await self.user_repo.get_by_email(email)

        if user is None:
            raise InvalidCredentialsError("Invalid email or password")

        if user.password_hash is None or not verify_password(
            password, user.password_hash
        ):
            raise InvalidCredentialsError("Invalid email or password")

        if not user.is_active:
            raise UserInactiveError("User account is inactive")

        return self._generate_tokens(user.id)

    async def logout(self, token: str) -> None:
        """Invalidate the given token by adding it to the blacklist.

        Args:
            token: The JWT token to invalidate.
        """
        payload = decode_token(token)
        if payload is not None:
            now = datetime.now(UTC)
            if payload.exp > now:
                expires_in = payload.exp - now
                await add_token_to_blacklist(token, expires_in)

    async def refresh_tokens(self, refresh_token: str) -> TokenResponse:
        """Refresh access token using refresh token.

        Args:
            refresh_token: The refresh token.

        Returns:
            New access and refresh tokens.

        Raises:
            InvalidTokenError: If refresh token is invalid or blacklisted.
        """
        if await is_token_blacklisted(refresh_token):
            raise InvalidTokenError("Token is blacklisted")

        payload = decode_token(refresh_token)
        if payload is None or payload.type != "refresh":
            raise InvalidTokenError("Invalid refresh token")

        try:
            user_id = UUID(payload.sub)
        except ValueError:
            raise InvalidTokenError("Invalid token payload") from None

        user = await self.user_repo.get_by_id(user_id)
        if user is None or not user.is_active:
            raise InvalidTokenError("User not found or inactive")

        # Blacklist old refresh token
        now = datetime.now(UTC)
        if payload.exp > now:
            expires_in = payload.exp - now
            await add_token_to_blacklist(refresh_token, expires_in)

        return self._generate_tokens(user.id)

    def _generate_tokens(self, user_id: UUID) -> TokenResponse:
        """Generate access and refresh tokens for a user.

        Args:
            user_id: The user's UUID.

        Returns:
            TokenResponse containing access and refresh tokens.
        """
        return TokenResponse(
            access_token=create_access_token(user_id),
            refresh_token=create_refresh_token(user_id),
        )
