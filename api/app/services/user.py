"""User service for user operations."""

from uuid import UUID

from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import UserProfileUpdate
from app.services.exceptions import UserNotFoundError


class UserService:
    """Service for user operations."""

    def __init__(self, user_repo: UserRepository) -> None:
        """Initialize the service with a user repository.

        Args:
            user_repo: The user repository instance.
        """
        self.user_repo = user_repo

    async def get_by_id(self, user_id: UUID) -> User:
        """Get user by ID.

        Args:
            user_id: The UUID of the user.

        Returns:
            The user.

        Raises:
            UserNotFoundError: If user is not found.
        """
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError(f"User {user_id} not found")
        return user

    async def update_profile(self, user_id: UUID, data: UserProfileUpdate) -> User:
        """Update user profile with allowed fields only.

        Args:
            user_id: The UUID of the user.
            data: The profile update data.

        Returns:
            The updated user.

        Raises:
            UserNotFoundError: If user is not found.
        """
        user = await self.get_by_id(user_id)

        # Only update fields that were provided (not None)
        update_data = data.model_dump(exclude_unset=True)

        if not update_data:
            return user  # Nothing to update

        return await self.user_repo.update(user, update_data)
