"""Service layer exceptions."""


class ServiceError(Exception):
    """Base exception for service layer errors."""

    pass


class AuthServiceError(ServiceError):
    """Base exception for authentication service errors."""

    pass


class EmailAlreadyExistsError(AuthServiceError):
    """Raised when email is already registered."""

    pass


class InvalidCredentialsError(AuthServiceError):
    """Raised when credentials are invalid."""

    pass


class UserInactiveError(AuthServiceError):
    """Raised when user account is inactive."""

    pass


class InvalidTokenError(AuthServiceError):
    """Raised when token is invalid or blacklisted."""

    pass


# --- Project Service Exceptions ---


class ProjectServiceError(ServiceError):
    """Base exception for project service errors."""

    pass


class ProjectNotFoundError(ProjectServiceError):
    """Raised when project is not found."""

    pass


class SlugAlreadyExistsError(ProjectServiceError):
    """Raised when project slug already exists."""

    pass


class PermissionDeniedError(ProjectServiceError):
    """Raised when user does not have permission to perform action."""

    pass


# --- Document Service Exceptions ---


class DocumentServiceError(ServiceError):
    """Base exception for document service errors."""

    pass


class DocumentNotFoundError(DocumentServiceError):
    """Raised when document is not found."""

    pass


class ParentNotFoundError(DocumentServiceError):
    """Raised when parent document is not found."""

    pass


class InvalidPathError(DocumentServiceError):
    """Raised when document path is invalid."""

    pass


class PathAlreadyExistsError(DocumentServiceError):
    """Raised when document path already exists."""

    pass


# --- Project Member Service Exceptions ---


class ProjectMemberServiceError(ServiceError):
    """Base exception for project member service errors."""

    pass


class MemberNotFoundError(ProjectMemberServiceError):
    """Raised when project member is not found."""

    pass


class MemberAlreadyExistsError(ProjectMemberServiceError):
    """Raised when user is already a member of the project."""

    pass


class CannotModifyOwnerError(ProjectMemberServiceError):
    """Raised when trying to add/modify/remove the project owner as a member."""

    pass


class CannotModifySelfError(ProjectMemberServiceError):
    """Raised when admin tries to modify their own role."""

    pass


class UserNotFoundError(ProjectMemberServiceError):
    """Raised when the target user does not exist."""

    pass
