"""FastAPI application entry point."""

import asyncio
import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1.router import api_router
from app.config import settings
from app.core.migration import MigrationError, run_migrations
from app.core.openapi import generate_simple_operation_id
from app.core.redis import close_redis, get_redis

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler for startup and shutdown events."""
    # Startup

    # 1. Run database migrations (if enabled)
    if settings.enable_auto_migration:
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, run_migrations)
        except MigrationError as e:
            logger.critical(f"Application startup aborted: {e}")
            raise SystemExit(1) from e

    # 2. Initialize Redis
    await get_redis()

    yield

    # Shutdown
    await close_redis()


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        description="RAG-native documentation tool API",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        generate_unique_id_function=generate_simple_operation_id,
    )

    # Include API v1 router
    app.include_router(api_router, prefix="/api/v1")

    return app


app = create_app()
