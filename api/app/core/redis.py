"""Redis client for token blacklist management."""

from datetime import timedelta

import redis.asyncio as redis

from app.config import settings

# Redis client instance
redis_client: redis.Redis | None = None

# Key prefix for token blacklist
BLACKLIST_PREFIX = "token_blacklist:"


async def get_redis() -> redis.Redis:
    """Get or create Redis client.

    Returns:
        Redis client instance.
    """
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    return redis_client


async def close_redis() -> None:
    """Close Redis connection."""
    global redis_client
    if redis_client is not None:
        await redis_client.close()
        redis_client = None


async def add_token_to_blacklist(token: str, expires_in: timedelta) -> None:
    """Add a token to the blacklist.

    Args:
        token: The JWT token to blacklist.
        expires_in: How long to keep the token in the blacklist.
    """
    client = await get_redis()
    key = f"{BLACKLIST_PREFIX}{token}"
    await client.setex(key, expires_in, "blacklisted")


async def is_token_blacklisted(token: str) -> bool:
    """Check if a token is blacklisted.

    Args:
        token: The JWT token to check.

    Returns:
        True if token is blacklisted, False otherwise.
    """
    client = await get_redis()
    key = f"{BLACKLIST_PREFIX}{token}"
    result = await client.get(key)
    return result is not None
