"""
Test configuration.

Uses a PostgreSQL database (asyncpg) for tests.
All models are created fresh for each test session.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from core.db import Base, get_db
from core.sessions import token_blacklist
from main import app

# ── PostgreSQL test engine ─────────────────────────────────────────────────
TEST_DATABASE_URL = "postgresql+asyncpg://gym_user:gym_password@localhost:5432/gym_db"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# ── fixtures ───────────────────────────────────────────────────────────────

@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_tables():
    """Create all tables once for the test session."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(autouse=True)
async def reset_blacklist():
    """Clear the JWT blacklist between tests."""
    token_blacklist._blacklist.clear()
    yield


@pytest_asyncio.fixture
async def client():
    """Async HTTP client wired to the FastAPI app with the test DB."""
    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


# ── helpers ────────────────────────────────────────────────────────────────

async def _register_and_login(client: AsyncClient, email: str, password: str, role: str):
    """
    Create a user directly via the service layer and return a valid JWT.
    For members we use the /members/register endpoint.
    For trainers/admins we create them directly via the service.
    """
    from tests.helpers import create_user_with_role
    from sqlalchemy.ext.asyncio import AsyncSession

    async with TestSessionLocal() as db:
        await create_user_with_role(db, email, password, role)

    resp = await client.post("/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()["data"]["access_token"]
