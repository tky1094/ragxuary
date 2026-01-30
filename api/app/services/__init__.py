"""Service layer for business logic."""

from app.services.auth import AuthService
from app.services.document import DocumentService
from app.services.exceptions import (
    AuthServiceError,
    CannotModifyOwnerError,
    CannotModifySelfError,
    DocumentNotFoundError,
    DocumentServiceError,
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    InvalidPathError,
    InvalidTokenError,
    MemberAlreadyExistsError,
    MemberNotFoundError,
    ParentNotFoundError,
    PathAlreadyExistsError,
    PermissionDeniedError,
    ProjectMemberServiceError,
    ProjectNotFoundError,
    ProjectServiceError,
    ServiceError,
    SlugAlreadyExistsError,
    UserInactiveError,
    UserNotFoundError,
)
from app.services.project import ProjectService
from app.services.project_bookmark import ProjectBookmarkService
from app.services.project_member import ProjectMemberService

__all__ = [
    "AuthService",
    "AuthServiceError",
    "CannotModifyOwnerError",
    "CannotModifySelfError",
    "DocumentNotFoundError",
    "DocumentService",
    "DocumentServiceError",
    "EmailAlreadyExistsError",
    "InvalidCredentialsError",
    "InvalidPathError",
    "InvalidTokenError",
    "MemberAlreadyExistsError",
    "MemberNotFoundError",
    "ParentNotFoundError",
    "PathAlreadyExistsError",
    "PermissionDeniedError",
    "ProjectBookmarkService",
    "ProjectMemberService",
    "ProjectMemberServiceError",
    "ProjectNotFoundError",
    "ProjectService",
    "ProjectServiceError",
    "ServiceError",
    "SlugAlreadyExistsError",
    "UserInactiveError",
    "UserNotFoundError",
]
