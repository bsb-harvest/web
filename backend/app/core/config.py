import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


class Settings(BaseSettings):
    APP_NAME: str = "AgriTech AI Guidance Moldova API"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    # Database (Aiven Cloud PostgreSQL 16+ with PostGIS)
    DATABASE_URL: str = "postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?sslmode=require"


    DB_SSL_CA_PATH: str = ""

    DB_POOL_SIZE: int = 3
    DB_MAX_OVERFLOW: int = 0

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Google Gemini AI
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.8-flash"

    # External Data Services
    SOLURI_WFS_ENDPOINT: str = "https://soluri.gov.md/geoserver/wfs"
    AGRODAT_API_ENDPOINT: str = "https://agrodat.md/api/v1"

    # Background Data Pipeline Scheduler (Task 3.3)
    SYNC_INTERVAL_HOURS: int = 1
    ENABLE_SCHEDULER: bool = True

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
