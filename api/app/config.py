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
    enable_auto_migration: bool = True

    # Database
    database_url: str = (
        "postgresql+asyncpg://ragxuary:ragxuary_dev@localhost:5432/ragxuary"
    )

    # Redis
    redis_url: str = "redis://localhost:6379"

    # JWT
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Upload
    upload_max_file_size: int = 10 * 1024 * 1024  # 10MB
    upload_allowed_mime_types: list[str] = [
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp",
    ]
    upload_storage_path: str = "./storage/uploads"
    upload_max_dimension: int = 2048
    upload_jpeg_quality: int = 85
    upload_webp_quality: int = 85
    upload_png_compression: int = 9
    storage_type: str = "local"  # "local" | "s3" (future)


settings = Settings()
