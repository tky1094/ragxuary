"""API dependencies for authentication and authorization."""

from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.redis import is_token_blacklisted
from app.core.security import decode_token
from app.models.user import User
from app.repositories.user import UserRepository

# HTTP Bearer security scheme
security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Get the current authenticated user from JWT token.

    Args:
        credentials: HTTP Bearer credentials containing the JWT token.
        db: Database session.

    Returns:
        The authenticated user.

    Raises:
        HTTPException: If token is invalid, expired, or user not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials

    # Check if token is blacklisted
    if await is_token_blacklisted(token):
        raise credentials_exception

    # Decode and validate token
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception

    # Ensure it's an access token
    if payload.type != "access":
        raise credentials_exception

    # Get user from database
    try:
        user_id = UUID(payload.sub)
    except ValueError:
        raise credentials_exception from None

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)

    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Get the current active user.

    Args:
        current_user: The authenticated user.

    Returns:
        The active user.

    Raises:
        HTTPException: If user is inactive.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    return current_user
