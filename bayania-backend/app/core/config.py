import os
from pydantic import field_validator
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
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/bayania"

    @field_validator("DATABASE_URL")
    @classmethod
    def fix_async_driver(cls, v: str) -> str:
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        return v
    @field_validator("JWT_SECRET")

    @classmethod
    def enforce_strong_jwt_secret(cls, v: str, info) -> str:
    # En production, on refuse de démarrer si le secret par défaut n'a pas été changé.
    # Mieux vaut un crash au déploiement qu'une faille silencieuse en prod.
      env = os.environ.get("ENV", "development")
      if env == "production" and v == "super-secret-jwt-key-change-me-in-production":
        raise ValueError(
            "JWT_SECRET doit être défini via une variable d'environnement en production "
            "(valeur par défaut détectée — refus de démarrage)."
        )
      return v
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
    ANTHROPIC_API_KEY: str = ""
    LLM_MODEL: str = "gemini-3.6-flash"                 
    GEMINI_GENERATION_API_KEY: str = ""   


    # ==========================
    # RAG
    # ==========================
    RAG_TOP_K: int = 20
    RAG_MIN_SCORE: float = 0.35

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
