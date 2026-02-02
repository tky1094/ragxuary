"""User repository for database operations."""

from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    """Repository for user-related database operations."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize the repository with a database session."""
        self.db = db

    async def get_by_email(self, email: str) -> User | None:
        """Get a user by email address.

        Args:
            email: The email address to search for.

        Returns:
            The user if found, None otherwise.
        """
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: UUID) -> User | None:
        """Get a user by ID.

        Args:
            user_id: The UUID of the user.

        Returns:
            The user if found, None otherwise.
        """
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(
        self,
        email: str,
        name: str,
        password_hash: str,
        auth_provider: str = "local",
    ) -> User:
        """Create a new user.

        Args:
            email: User's email address.
            name: User's display name.
            password_hash: Hashed password.
            auth_provider: Authentication provider (default: "local").

        Returns:
            The created user.
        """
        user = User(
            email=email,
            name=name,
            password_hash=password_hash,
            auth_provider=auth_provider,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def email_exists(self, email: str) -> bool:
        """Check if an email address is already registered.

        Args:
            email: The email address to check.

        Returns:
            True if email exists, False otherwise.
        """
        user = await self.get_by_email(email)
        return user is not None

    async def update(self, user: User, data: dict[str, Any]) -> User:
        """Update user with given data.

        Args:
            user: The user to update.
            data: Dictionary of fields to update.

        Returns:
            The updated user.
        """
        for key, value in data.items():
            if hasattr(user, key):
                setattr(user, key, value)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def admin_exists(self) -> bool:
        """Check if an admin user exists.

        Returns:
            True if an admin user exists, False otherwise.
        """
        stmt = select(User).where(User.is_admin.is_(True))
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def create_admin(
        self,
        email: str,
        name: str,
        password_hash: str,
    ) -> User:
        """Create a new admin user.

        Args:
            email: User's email address.
            name: User's display name.
            password_hash: Hashed password.

        Returns:
            The created admin user.
        """
        user = User(
            email=email,
            name=name,
            password_hash=password_hash,
            auth_provider="local",
            is_admin=True,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
