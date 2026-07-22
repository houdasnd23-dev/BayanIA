import os
from pydantic_settings import BaseSettings, SettingsConfigDict
class Settings(BaseSettings):
    PROJECT_NAME: str = "BayanIA"
    ENV: str = "development"
    DEBUG: bool = True
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/bayania"
    # Security
    JWT_SECRET: str = "super-secret-jwt-key-change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    # Vector DB
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str = ""
    # LLM
    LLM_PROVIDER: str = "mock"
    LLM_API_KEY: str = ""
    LLM_API_URL: str = "https://api.openai.com/v1"
    LLM_MODEL: str = "gpt-4o"
    # RAG Settings
    RAG_TOP_K: int = 3
    RAG_MIN_SCORE: float = 0.3
    # Storage
    UPLOAD_DIR: str = "./uploads"
    # Rate limiting
    RATE_LIMIT_LIMIT: int = 20  # requests
    RATE_LIMIT_PERIOD: int = 60 # seconds
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        extra="ignore"
    )
settings = Settings()