"""Setup endpoints for initial configuration."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.user import UserRepository
from app.schemas.auth import TokenResponse
from app.schemas.setup import AdminCreateRequest, SetupStatusResponse
from app.services.exceptions import EmailAlreadyExistsError, SetupAlreadyCompletedError
from app.services.setup import SetupService

router = APIRouter(prefix="/setup", tags=["setup"])


def get_setup_service(db: AsyncSession = Depends(get_db)) -> SetupService:
    """Dependency to get SetupService instance."""
    return SetupService(UserRepository(db))


@router.get("/status", response_model=SetupStatusResponse)
async def get_setup_status(
    setup_service: Annotated[SetupService, Depends(get_setup_service)],
) -> SetupStatusResponse:
    """Get the setup status.

    Returns:
        Setup status indicating if setup is completed and if admin is required.
    """
    return SetupStatusResponse(**await setup_service.get_status())


@router.post(
    "/admin",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_admin(
    request: AdminCreateRequest,
    setup_service: Annotated[SetupService, Depends(get_setup_service)],
) -> TokenResponse:
    """Create a new admin user.

    Args:
        request: The request containing the admin user's email, name, and password.

    Returns:
        Access and refresh tokens.

    Raises:
        HTTPException: If setup is already completed (403) or email exists (400).
    """
    try:
        return await setup_service.create_admin(
            request.email, request.name, request.password
        )
    except SetupAlreadyCompletedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e)) from e
    except EmailAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
