# Application configuration — loaded from environment variables
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost/gym_db"

    # JWT
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # App
    APP_NAME: str = "Gym Management System"
    DEBUG: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
