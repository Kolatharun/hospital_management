"""
Application Configuration - Loaded from environment variables
"""

from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    All settings are derived from frontend requirements.
    """

    # Application
    APP_NAME: str = "Balaji Heart Center API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/balaji_heart_center"
    DATABASE_ECHO: bool = False

    # JWT Authentication
    # Frontend shows 8-hour session (standard clinic day)
    JWT_SECRET_KEY: str = "balaji-heart-center-jwt-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours (clinic day)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Security
    BCRYPT_ROUNDS: int = 12

    # CORS - Frontend runs on Vite default port (also allow common dev ports)
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:8081,http://127.0.0.1:5173,http://localhost:3000,http://localhost:4173,http://127.0.0.1:3000"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse ALLOWED_ORIGINS string into list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]


@lru_cache()
def get_settings() -> Settings:
    """
    Cached settings instance.
    Returns the same instance for all calls.
    """
    return Settings()


# Global settings instance
settings = get_settings()
