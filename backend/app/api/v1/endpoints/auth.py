"""Authentication endpoints."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.core.redis import add_token_to_blacklist, is_token_blacklisted
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.auth import (
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.user import UserRead

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Register a new user.

    Args:
        request: Registration request containing email, name, and password.
        db: Database session.

    Returns:
        Access and refresh tokens.

    Raises:
        HTTPException: If email is already registered.
    """
    user_repo = UserRepository(db)

    # Check if email already exists
    if await user_repo.email_exists(request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create user with hashed password
    hashed_password = hash_password(request.password)
    user = await user_repo.create(
        email=request.email,
        name=request.name,
        password_hash=hashed_password,
        auth_provider="local",
    )

    # Generate tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Login with email and password.

    Args:
        request: Login request containing email and password.
        db: Database session.

    Returns:
        Access and refresh tokens.

    Raises:
        HTTPException: If credentials are invalid.
    """
    user_repo = UserRepository(db)

    # Get user by email
    user = await user_repo.get_by_email(request.email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Verify password
    if user.password_hash is None or not verify_password(
        request.password, user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    # Generate tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> None:
    """Logout and invalidate the current access token.

    Args:
        credentials: HTTP Bearer credentials containing the JWT token.
    """
    token = credentials.credentials

    # Decode token to get expiration time
    payload = decode_token(token)
    if payload is not None:
        # Calculate remaining time until expiration
        from datetime import UTC, datetime

        now = datetime.now(UTC)
        if payload.exp > now:
            expires_in = payload.exp - now
            await add_token_to_blacklist(token, expires_in)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: RefreshTokenRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Refresh access token using a refresh token.

    Args:
        request: Refresh token request.
        db: Database session.

    Returns:
        New access and refresh tokens.

    Raises:
        HTTPException: If refresh token is invalid.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid refresh token",
    )

    # Check if token is blacklisted
    if await is_token_blacklisted(request.refresh_token):
        raise credentials_exception

    # Decode refresh token
    payload = decode_token(request.refresh_token)
    if payload is None:
        raise credentials_exception

    # Ensure it's a refresh token
    if payload.type != "refresh":
        raise credentials_exception

    # Get user from database
    try:
        user_id = UUID(payload.sub)
    except ValueError:
        raise credentials_exception from None

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)

    if user is None or not user.is_active:
        raise credentials_exception

    # Blacklist old refresh token
    from datetime import UTC, datetime

    now = datetime.now(UTC)
    if payload.exp > now:
        expires_in = payload.exp - now
        await add_token_to_blacklist(request.refresh_token, expires_in)

    # Generate new tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.get("/me", response_model=UserRead)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> User:
    """Get current user information.

    Args:
        current_user: The authenticated user.

    Returns:
        User information.
    """
    return current_user
