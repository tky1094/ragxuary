"""Authentication endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.auth import (
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.user import UserRead
from app.services import (
    AuthService,
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    InvalidTokenError,
    UserInactiveError,
)

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    """Dependency to get AuthService instance.

    Args:
        db: Database session.

    Returns:
        AuthService instance with UserRepository.
    """
    return AuthService(UserRepository(db))


@router.post(
    "/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED
)
async def register(
    request: RegisterRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    """Register a new user.

    Args:
        request: Registration request containing email, name, and password.
        auth_service: Authentication service.

    Returns:
        Access and refresh tokens.

    Raises:
        HTTPException: If email is already registered.
    """
    try:
        return await auth_service.register(
            email=request.email,
            name=request.name,
            password=request.password,
        )
    except EmailAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    """Login with email and password.

    Args:
        request: Login request containing email and password.
        auth_service: Authentication service.

    Returns:
        Access and refresh tokens.

    Raises:
        HTTPException: If credentials are invalid or user is inactive.
    """
    try:
        return await auth_service.login(request.email, request.password)
    except InvalidCredentialsError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        ) from e
    except UserInactiveError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> None:
    """Logout and invalidate the current access token.

    Args:
        credentials: HTTP Bearer credentials containing the JWT token.
        auth_service: Authentication service.
    """
    await auth_service.logout(credentials.credentials)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: RefreshTokenRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    """Refresh access token using a refresh token.

    Args:
        request: Refresh token request.
        auth_service: Authentication service.

    Returns:
        New access and refresh tokens.

    Raises:
        HTTPException: If refresh token is invalid.
    """
    try:
        return await auth_service.refresh_tokens(request.refresh_token)
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        ) from None


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
