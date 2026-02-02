"""Setup service for initial configuration."""

from app.core.security import create_access_token, create_refresh_token, hash_password
from app.repositories.user import UserRepository
from app.schemas.auth import TokenResponse
from app.services.exceptions import EmailAlreadyExistsError, SetupAlreadyCompletedError


class SetupService:
    """Service for setup operations."""

    def __init__(self, user_repo: UserRepository) -> None:
        """Initialize the service with a user repository."""
        self.user_repo = user_repo

    async def get_status(self) -> dict[str, bool]:
        """Get the setup status.

        Returns:
            A dictionary with the setup status.
        """
        admin_exists = await self.user_repo.admin_exists()
        return {
            "is_setup_completed": admin_exists,
            "requires_admin": not admin_exists,
        }

    async def create_admin(
        self,
        email: str,
        name: str,
        password: str,
    ) -> TokenResponse:
        """Create a new admin user.

        Args:
            email: The email address of the admin user.
            name: The name of the admin user.
            password: The password of the admin user.

        Returns:
            Access and refresh tokens.

        Raises:
            SetupAlreadyCompletedError: If the setup has already been completed.
            EmailAlreadyExistsError: If the email address already exists.
        """
        # Check if setup has already been completed
        if await self.user_repo.admin_exists():
            raise SetupAlreadyCompletedError("Setup has already been completed")
        # Check if email address already exists
        if await self.user_repo.email_exists(email):
            raise EmailAlreadyExistsError("Email address already exists")
        # Hash password
        password_hash = hash_password(password)
        # Create admin user
        user = await self.user_repo.create_admin(email, name, password_hash)
        # Generate access and refresh tokens
        return TokenResponse(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
        )
