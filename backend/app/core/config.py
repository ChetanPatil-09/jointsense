from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    ANTHROPIC_API_KEY: str = ""
    # In production (Railway), set ALLOWED_ORIGINS env var to your frontend URL
    # e.g. ALLOWED_ORIGINS=["https://jointsense-frontend.up.railway.app"]
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    FRONTEND_URL: str = ""   # set this on Railway to your frontend URL
    APP_ENV: str = "development"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
