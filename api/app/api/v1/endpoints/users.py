"""Users API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import UserProfileUpdate, UserRead
from app.services.user import UserService

router = APIRouter(prefix="/users", tags=["users"])


def get_user_service(db: Annotated[AsyncSession, Depends(get_db)]) -> UserService:
    """Dependency to get UserService."""
    return UserService(UserRepository(db))


@router.patch("/me", response_model=UserRead)
async def update_my_profile(
    data: UserProfileUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[UserService, Depends(get_user_service)],
) -> User:
    """Update current user's profile.

    Allows updating:
    - name: Display name (1-100 characters)
    - avatar_url: URL to avatar image (max 500 characters)
    - preferred_locale: Preferred locale code (2-10 characters, e.g., "en", "ja")
    """
    return await service.update_profile(current_user.id, data)
