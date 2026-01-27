"""Service layer for business logic."""

from app.services.auth import AuthService
from app.services.document import DocumentService
from app.services.exceptions import (
    AuthServiceError,
    DocumentNotFoundError,
    DocumentServiceError,
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    InvalidPathError,
    InvalidTokenError,
    ParentNotFoundError,
    PathAlreadyExistsError,
    PermissionDeniedError,
    ProjectNotFoundError,
    ProjectServiceError,
    ServiceError,
    SlugAlreadyExistsError,
    UserInactiveError,
)
from app.services.project import ProjectService

__all__ = [
    "AuthService",
    "AuthServiceError",
    "DocumentNotFoundError",
    "DocumentService",
    "DocumentServiceError",
    "EmailAlreadyExistsError",
    "InvalidCredentialsError",
    "InvalidPathError",
    "InvalidTokenError",
    "ParentNotFoundError",
    "PathAlreadyExistsError",
    "PermissionDeniedError",
    "ProjectNotFoundError",
    "ProjectService",
    "ProjectServiceError",
    "ServiceError",
    "SlugAlreadyExistsError",
    "UserInactiveError",
]
