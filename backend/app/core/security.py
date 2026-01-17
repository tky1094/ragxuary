"""Security utilities for password hashing and JWT handling."""

from datetime import UTC, datetime, timedelta
from uuid import UUID

import bcrypt
from jose import JWTError, jwt

from app.config import settings


def hash_password(password: str) -> str:
    """Hash a password using bcrypt.

    Args:
        password: Plain text password.

    Returns:
        Hashed password string.
    """
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash.

    Args:
        plain_password: Plain text password to verify.
        hashed_password: Hashed password to compare against.

    Returns:
        True if password matches, False otherwise.
    """
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def create_access_token(user_id: UUID, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token.

    Args:
        user_id: The user's UUID.
        expires_delta: Optional custom expiration time.

    Returns:
        Encoded JWT string.
    """
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(
        to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
    )


def create_refresh_token(user_id: UUID, expires_delta: timedelta | None = None) -> str:
    """Create a JWT refresh token.

    Args:
        user_id: The user's UUID.
        expires_delta: Optional custom expiration time.

    Returns:
        Encoded JWT string.
    """
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)

    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "type": "refresh",
    }
    return jwt.encode(
        to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
    )


class TokenPayload:
    """Decoded token payload."""

    def __init__(self, sub: str, exp: datetime, token_type: str) -> None:
        """Initialize token payload."""
        self.sub = sub
        self.exp = exp
        self.type = token_type


def decode_token(token: str) -> TokenPayload | None:
    """Decode and validate a JWT token.

    Args:
        token: The JWT token string.

    Returns:
        TokenPayload if valid, None otherwise.
    """
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
        sub: str | None = payload.get("sub")
        exp: int | None = payload.get("exp")
        token_type: str | None = payload.get("type")

        if sub is None or exp is None or token_type is None:
            return None

        return TokenPayload(
            sub=sub,
            exp=datetime.fromtimestamp(exp, tz=UTC),
            token_type=token_type,
        )
    except JWTError:
        return None
