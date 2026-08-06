from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE_PATH = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    """
    Application settings — reads from .env file and environment variables.
    Environment variables take precedence over .env values.
    """
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE_PATH),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    OPENAI_API_KEY: str | None = Field(default=None)
    GEMINI_API_KEY: str | None = Field(default=None)
    GOOGLE_API_KEY: str | None = Field(default=None)
    CHROMA_PERSIST_DIR: str = Field(default="./chromadb")
    CHROMA_COLLECTION_NAME: str = Field(default="insurance_policies")
    MAX_CHUNK_SIZE: int = Field(default=500)
    MIN_CHUNK_SIZE: int = Field(default=400)
    MONGODB_URI: str = Field(default="mongodb://localhost:27017")
    MONGO_DB_NAME: str = Field(default="insurance_db")
    MONGO_COLLECTION_NAME: str = Field(default="policies")


# Singleton — will read from .env automatically via pydantic-settings
settings = Settings()
