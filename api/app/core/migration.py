"""Database migration utilities for application startup."""

import logging
from pathlib import Path

from alembic import command
from alembic.config import Config

from app.config import settings

logger = logging.getLogger(__name__)


class MigrationError(Exception):
    """Raised when database migration fails."""

    pass


def get_alembic_config() -> Config:
    """Create Alembic configuration.

    Returns:
        Alembic Config object configured for the application.
    """
    base_path = Path(__file__).resolve().parent.parent.parent
    alembic_ini_path = base_path / "alembic.ini"
    config = Config(str(alembic_ini_path))
    config.set_main_option("sqlalchemy.url", settings.database_url)
    return config


def run_migrations() -> None:
    """Run all pending database migrations.

    This function runs Alembic's upgrade command to apply all pending
    migrations up to the latest revision ('head').

    Raises:
        MigrationError: If migration fails for any reason.
    """
    try:
        logger.info("Running database migrations...")
        config = get_alembic_config()
        command.upgrade(config, "head")
        logger.info("Database migrations completed successfully.")
    except Exception as e:
        logger.error(f"Database migration failed: {e}")
        raise MigrationError(f"Failed to run database migrations: {e}") from e
