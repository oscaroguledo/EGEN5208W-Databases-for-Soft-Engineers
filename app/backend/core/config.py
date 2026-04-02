# Application configuration - loads from environment variables
import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database connection string
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost/gym_db"
    
    # JWT security settings
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # App settings
    APP_NAME: str = "Gym Management System"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"


settings = Settings()