"""Tests for /health and / endpoints."""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_root(client: AsyncClient):
    r = await client.get("/")
    assert r.status_code == 200
    assert r.json()["status"] == "running"


async def test_health_check(client: AsyncClient):
    r = await client.get("/health/")
    assert r.status_code == 200
    assert r.json()["data"]["status"] == "healthy"
