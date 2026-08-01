import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ==========================
    # Application
    # ==========================
    PROJECT_NAME: str = "BayanIA"
    ENV: str = "development"
    DEBUG: bool = True

    # ==========================
    # Database
    # ==========================
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/bayania"

    # ==========================
    # Security
    # ==========================
    JWT_SECRET: str = "super-secret-jwt-key-change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ==========================
    # Qdrant
    # ==========================
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str = ""

    # ==========================
    # Gemini
    # ==========================
    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""
    LLM_MODEL: str = "gemini-3.5-flash-lite"

    # ==========================
    # RAG
    # ==========================
    RAG_TOP_K: int = 4
    RAG_MIN_SCORE: float = 0.5

    # ==========================
    # Storage
    # ==========================
    UPLOAD_DIR: str = "./uploads"

    # ==========================
    # Rate Limiting
    # ==========================
    RATE_LIMIT_LIMIT: int = 20
    RATE_LIMIT_PERIOD: int = 60

    model_config = SettingsConfigDict(
        env_file=os.path.join(
            os.path.dirname(
                os.path.dirname(
                    os.path.dirname(__file__)
                )
            ),
            ".env",
        ),
        extra="ignore",
    )


settings = Settings()