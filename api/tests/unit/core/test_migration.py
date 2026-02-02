"""Unit tests for migration module."""

from unittest.mock import Mock, patch

import pytest

from app.core.migration import MigrationError, get_alembic_config, run_migrations


def test_get_alembic_config_creates_valid_config() -> None:
    """Test that get_alembic_config creates a valid Alembic Config."""
    config = get_alembic_config()

    assert config.get_main_option("sqlalchemy.url") is not None


@patch("app.core.migration.command.upgrade")
def test_run_migrations_success(mock_upgrade: Mock) -> None:
    """Test successful migration execution."""
    run_migrations()

    mock_upgrade.assert_called_once()
    call_args = mock_upgrade.call_args
    assert call_args[0][1] == "head"


@patch("app.core.migration.command.upgrade")
def test_run_migrations_failure_raises_migration_error(mock_upgrade: Mock) -> None:
    """Test that migration failure raises MigrationError."""
    mock_upgrade.side_effect = Exception("Database connection failed")

    with pytest.raises(MigrationError) as exc_info:
        run_migrations()

    assert "Failed to run database migrations" in str(exc_info.value)
