from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional, List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Madadgar API"
    DATABASE_URL: Optional[str] = None
    USE_MOCK_DATA: bool = True
    OPENAI_API_KEY: Optional[str] = None
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    ALLOWED_ORIGINS: List[str] = ["*"]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v):
        if isinstance(v, str):
            return [o.strip() for o in v.split(",")]
        return v

    class Config:
        env_file = ".env"

settings = Settings()
