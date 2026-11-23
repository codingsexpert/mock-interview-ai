from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    ENVIRONMENT: str = "development"
    PORT: int = 8000
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # Google Gemini
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # Murf.ai Voice
    MURF_API_KEY: str = ""
    MURF_VOICE_ID: str = "en-US-marcus"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

settings = Settings()
