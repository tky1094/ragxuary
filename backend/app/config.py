"""Application configuration using Pydantic Settings."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "ragxuary"
    debug: bool = False

    # Database
    database_url: str = (
        "postgresql+asyncpg://ragxuary:ragxuary_dev@localhost:5432/ragxuary"
    )

    # Redis
    redis_url: str = "redis://localhost:6379"


settings = Settings()
