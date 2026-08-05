from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    OPENAI_API_KEY: str | None = Field(None)
    CHROMA_PERSIST_DIR: str = Field("./chromadb")
    CHROMA_COLLECTION_NAME: str = Field("insurance_policies")
    MAX_CHUNK_SIZE: int = Field(500)
    MIN_CHUNK_SIZE: int = Field(400)
    MONGODB_URI: str = Field("mongodb://localhost:27017")
    MONGO_DB_NAME: str = Field("insurance_db")
    MONGO_COLLECTION_NAME: str = Field("policies")


settings = Settings(
    OPENAI_API_KEY=None,
    CHROMA_PERSIST_DIR="./chromadb",
    CHROMA_COLLECTION_NAME="insurance_policies",
    MAX_CHUNK_SIZE=500,
    MIN_CHUNK_SIZE=400,
    MONGODB_URI="mongodb://localhost:27017",
    MONGO_DB_NAME="insurance_db",
    MONGO_COLLECTION_NAME="policies",
)
