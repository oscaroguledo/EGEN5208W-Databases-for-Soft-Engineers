# Database setup with SQLAlchemy async
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

from core.config import settings


# Async engine and session factory
engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Base class for all models
Base = declarative_base()


async def get_db():
    """Get database session for FastAPI dependency injection"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()