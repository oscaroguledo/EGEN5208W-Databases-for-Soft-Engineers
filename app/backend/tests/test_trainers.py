"""Tests for /trainers/* endpoints."""
import pytest
from httpx import AsyncClient
from tests.conftest import TestSessionLocal
from tests.helpers import create_user_with_role

pytestmark = pytest.mark.asyncio

_counter = 0


def _email(tag: str) -> str:
    global _counter
    _counter += 1
    return f"tr_{tag}_{_counter}@test.com"


async def _make_trainer(email: str, pw: str = "Pass123!") -> None:
    async with TestSessionLocal() as db:
        await create_user_with_role(db, email, pw, "trainer")


async def _login(client: AsyncClient, email: str, pw: str = "Pass123!") -> str:
    r = await client.post("/auth/login", json={"email": email, "password": pw})
    assert r.status_code == 200, r.text
    return r.json()["data"]["access_token"]


# ── availability ───────────────────────────────────────────────────────────

async def test_set_availability(client: AsyncClient):
    email = _email("avail")
    await _make_trainer(email)
    token = await _login(client, email)
    r = await client.post(
        "/trainers/availability",
        params={"available_date": "2026-05-01", "start_at": "09:00", "end_at": "12:00"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert "availability_id" in r.json()["data"]


async def test_set_availability_requires_trainer_role(client: AsyncClient):
    """A member cannot set trainer availability."""
    r_reg = await client.post("/members/register", json={
        "email": _email("avail_mem"), "password": "Pass123!",
        "full_name": "M", "date_of_birth": "1990-01-01",
        "gender": "male", "phone": f"555-{_counter:06d}",
    })
    assert r_reg.status_code == 200
    token = (await client.post("/auth/login", json={
        "email": r_reg.json()["data"]["email"] if "email" in r_reg.json().get("data", {}) else _email("x"),
        "password": "Pass123!",
    })).json()["data"]["access_token"]

    # Re-login with the registered email
    login_email = f"tr_avail_mem_{_counter}@test.com"
    r_reg2 = await client.post("/members/register", json={
        "email": login_email, "password": "Pass123!",
        "full_name": "M2", "date_of_birth": "1990-01-01",
        "gender": "male", "phone": f"555-{_counter+1:06d}",
    })
    token2 = (await client.post("/auth/login", json={"email": login_email, "password": "Pass123!"})).json()["data"]["access_token"]

    r = await client.post(
        "/trainers/availability",
        params={"available_date": "2026-05-01", "start_at": "09:00", "end_at": "12:00"},
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert r.status_code == 403


# ── schedule ───────────────────────────────────────────────────────────────

async def test_get_schedule(client: AsyncClient):
    email = _email("sched")
    await _make_trainer(email)
    token = await _login(client, email)
    r = await client.get("/trainers/schedule", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    data = r.json()["data"]
    assert "upcoming_sessions" in data
    assert "upcoming_classes" in data


async def test_get_schedule_unauthenticated(client: AsyncClient):
    r = await client.get("/trainers/schedule")
    assert r.status_code == 401


# ── list trainers (admin only) ─────────────────────────────────────────────

async def test_list_trainers_requires_admin(client: AsyncClient):
    email = _email("lst")
    await _make_trainer(email)
    token = await _login(client, email)
    r = await client.get("/trainers/list", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403
