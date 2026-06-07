from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/sql_assistant"

    # AI APIs
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    # App
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me-in-production"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # AI model IDs (override via .env to upgrade without code changes)
    ANTHROPIC_MODEL: str = "claude-sonnet-4-20250514"
    OPENAI_MODEL: str = "gpt-4o"

    # Schema cache TTL in seconds
    SCHEMA_CACHE_TTL: int = 60

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 20

    # Logging
    LOG_LEVEL: str = "INFO"

    @property
    def origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
