from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Madadgar API"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/madadgar"
    USE_MOCK_DATA: bool = True
    OPENAI_API_KEY: Optional[str] = None
    GOOGLE_MAPS_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"

settings = Settings()
