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
