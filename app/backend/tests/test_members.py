"""Tests for /members/* endpoints."""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

_counter = 0


def _email(tag: str) -> str:
    global _counter
    _counter += 1
    return f"mem_{tag}_{_counter}@test.com"


async def _register(client: AsyncClient, email: str, pw: str = "Pass123!") -> dict:
    r = await client.post("/members/register", json={
        "email": email, "password": pw,
        "full_name": "Test Member", "date_of_birth": "1995-06-15",
        "gender": "female", "phone": f"555-{_counter:06d}",
    })
    assert r.status_code == 200, r.text
    return r.json()["data"]


async def _login(client: AsyncClient, email: str, pw: str = "Pass123!") -> str:
    r = await client.post("/auth/login", json={"email": email, "password": pw})
    assert r.status_code == 200, r.text
    return r.json()["data"]["access_token"]


# ── registration ───────────────────────────────────────────────────────────

async def test_register_member_success(client: AsyncClient):
    email = _email("reg")
    data = await _register(client, email)
    assert data["full_name"] == "Test Member"
    assert "id" in data


async def test_register_duplicate_email(client: AsyncClient):
    email = _email("dup")
    await _register(client, email)
    r = await client.post("/members/register", json={
        "email": email, "password": "Pass123!",
        "full_name": "Dup", "date_of_birth": "1990-01-01",
        "gender": "male", "phone": f"555-{_counter:06d}",
    })
    assert r.status_code == 400


# ── /members/me ────────────────────────────────────────────────────────────

async def test_get_me(client: AsyncClient):
    email = _email("me")
    await _register(client, email)
    token = await _login(client, email)
    r = await client.get("/members/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["data"]["full_name"] == "Test Member"


async def test_get_me_unauthenticated(client: AsyncClient):
    r = await client.get("/members/me")
    assert r.status_code == 401


async def test_update_me(client: AsyncClient):
    email = _email("upd")
    await _register(client, email)
    token = await _login(client, email)
    r = await client.put(
        "/members/me",
        json={"full_name": "Updated Name"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert r.json()["data"]["full_name"] == "Updated Name"


# ── health metrics ─────────────────────────────────────────────────────────

async def test_add_and_list_health_metric(client: AsyncClient):
    email = _email("hm")
    await _register(client, email)
    token = await _login(client, email)
    headers = {"Authorization": f"Bearer {token}"}

    r = await client.post(
        "/members/health-metrics",
        params={"metric_type": "weight", "metric_value": 75.5},
        headers=headers,
    )
    assert r.status_code == 200
    assert "metric_id" in r.json()["data"]

    r2 = await client.get("/members/health-history", headers=headers)
    assert r2.status_code == 200
    metrics = r2.json()["data"]
    assert len(metrics) >= 1
    assert metrics[0]["metric_type"] == "weight"


# ── fitness goals ──────────────────────────────────────────────────────────

async def test_add_and_list_goals(client: AsyncClient):
    email = _email("goals")
    await _register(client, email)
    token = await _login(client, email)
    headers = {"Authorization": f"Bearer {token}"}

    r = await client.post(
        "/members/goals",
        json=[{"description": "Run 5k", "target_value": "5km"}],
        headers=headers,
    )
    assert r.status_code == 200
    assert len(r.json()["data"]) == 1

    r2 = await client.get("/members/goals/list", headers=headers)
    assert r2.status_code == 200
    assert len(r2.json()["data"]) >= 1


# ── classes ────────────────────────────────────────────────────────────────

async def test_list_available_classes_empty(client: AsyncClient):
    email = _email("cls")
    await _register(client, email)
    token = await _login(client, email)
    r = await client.get("/members/classes/available", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert isinstance(r.json()["data"], list)


# ── dashboard ──────────────────────────────────────────────────────────────

async def test_dashboard(client: AsyncClient):
    email = _email("dash")
    await _register(client, email)
    token = await _login(client, email)
    r = await client.get("/members/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    data = r.json()["data"]
    assert "upcoming_classes" in data
    assert "upcoming_sessions" in data


# ── admin list members ─────────────────────────────────────────────────────

async def test_list_members_requires_admin(client: AsyncClient):
    email = _email("lst")
    await _register(client, email)
    token = await _login(client, email)
    r = await client.get("/members/list", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403
