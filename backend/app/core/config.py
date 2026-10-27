from typing import List, Optional, Union
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "FP&A Insight Copilot"
    API_V1_PREFIX: str = "/api"
    FRONTEND_ORIGIN: Union[str, List[str]] = "http://localhost:5173,http://127.0.0.1:5173"

    # LLM and Vector Store Settings
    GEMINI_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gemini-2.5-flash"
    EMBEDDING_MODEL: str = "text-embedding-004"
    CHROMA_PERSIST_DIRECTORY: str = "./data/chroma"

    # File and Ingestion Limits
    MAX_UPLOAD_MB: int = 10
    MAX_CSV_ROWS: int = 10000
    UPLOAD_DIR: str = "./data/uploads"

    @property
    def cors_origins(self) -> List[str]:
        if isinstance(self.FRONTEND_ORIGIN, list):
            return self.FRONTEND_ORIGIN
        return [origin.strip() for origin in self.FRONTEND_ORIGIN.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

