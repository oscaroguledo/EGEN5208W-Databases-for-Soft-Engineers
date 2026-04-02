"""Tests for /admin/* endpoints."""
import pytest
from httpx import AsyncClient
from tests.conftest import TestSessionLocal
from tests.helpers import create_user_with_role, create_room

pytestmark = pytest.mark.asyncio

_counter = 0


def _email(tag: str) -> str:
    global _counter
    _counter += 1
    return f"adm_{tag}_{_counter}@test.com"


async def _make_admin(email: str, pw: str = "Pass123!") -> None:
    async with TestSessionLocal() as db:
        await create_user_with_role(db, email, pw, "admin")


async def _login(client: AsyncClient, email: str, pw: str = "Pass123!") -> str:
    r = await client.post("/auth/login", json={"email": email, "password": pw})
    assert r.status_code == 200, r.text
    return r.json()["data"]["access_token"]


# ── equipment CRUD ─────────────────────────────────────────────────────────

async def test_create_and_list_equipment(client: AsyncClient):
    email = _email("equip")
    await _make_admin(email)
    token = await _login(client, email)
    headers = {"Authorization": f"Bearer {token}"}

    # Need a room first
    async with TestSessionLocal() as db:
        room = await create_room(db, name=f"Room-{_counter}")
    room_id = str(room.id)

    # Create equipment
    r = await client.post(
        "/admin/equipment",
        params={"equipment_name": "Treadmill", "room_id": room_id, "status": "operational"},
        headers=headers,
    )
    assert r.status_code == 200, r.text
    equip_id = r.json()["data"]["equipment_id"]

    # List equipment
    r2 = await client.get("/admin/equipment", headers=headers)
    assert r2.status_code == 200
    items = r2.json()["data"]
    assert any(i["id"] == equip_id for i in items)


async def test_update_equipment_status(client: AsyncClient):
    email = _email("equip_upd")
    await _make_admin(email)
    token = await _login(client, email)
    headers = {"Authorization": f"Bearer {token}"}

    async with TestSessionLocal() as db:
        room = await create_room(db, name=f"Room-upd-{_counter}")

    r = await client.post(
        "/admin/equipment",
        params={"equipment_name": "Bike", "room_id": str(room.id)},
        headers=headers,
    )
    assert r.status_code == 200
    equip_id = r.json()["data"]["equipment_id"]

    r2 = await client.put(
        f"/admin/equipment/{equip_id}/status",
        params={"status": "under_repair", "notes": "Needs belt replacement"},
        headers=headers,
    )
    assert r2.status_code == 200


async def test_delete_equipment(client: AsyncClient):
    email = _email("equip_del")
    await _make_admin(email)
    token = await _login(client, email)
    headers = {"Authorization": f"Bearer {token}"}

    async with TestSessionLocal() as db:
        room = await create_room(db, name=f"Room-del-{_counter}")

    r = await client.post(
        "/admin/equipment",
        params={"equipment_name": "Rowing Machine", "room_id": str(room.id)},
        headers=headers,
    )
    equip_id = r.json()["data"]["equipment_id"]

    r2 = await client.delete(f"/admin/equipment/{equip_id}", headers=headers)
    assert r2.status_code == 200


async def test_equipment_status_options(client: AsyncClient):
    email = _email("equip_opts")
    await _make_admin(email)
    token = await _login(client, email)
    r = await client.get("/admin/equipment/status-options", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    opts = r.json()["data"]
    values = [o["value"] for o in opts]
    assert "operational" in values
    assert "under_repair" in values
    assert "out_of_service" in values


# ── sessions list ──────────────────────────────────────────────────────────

async def test_list_sessions(client: AsyncClient):
    email = _email("sess_lst")
    await _make_admin(email)
    token = await _login(client, email)
    r = await client.get("/admin/sessions/list", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert isinstance(r.json()["data"], list)


# ── payments list ──────────────────────────────────────────────────────────

async def test_list_payments(client: AsyncClient):
    email = _email("pay_lst")
    await _make_admin(email)
    token = await _login(client, email)
    r = await client.get("/admin/payments/list", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert isinstance(r.json()["data"], list)


# ── role enforcement ───────────────────────────────────────────────────────

async def test_admin_endpoints_reject_member(client: AsyncClient):
    r_reg = await client.post("/members/register", json={
        "email": _email("rej"), "password": "Pass123!",
        "full_name": "M", "date_of_birth": "1990-01-01",
        "gender": "male", "phone": f"555-{_counter:06d}",
    })
    assert r_reg.status_code == 200
    email = f"adm_rej_{_counter}@test.com"
    # Use the email we just registered
    login_email = r_reg.request.content  # not useful; just re-derive
    # Simpler: register fresh
    fresh_email = _email("rej2")
    await client.post("/members/register", json={
        "email": fresh_email, "password": "Pass123!",
        "full_name": "M2", "date_of_birth": "1990-01-01",
        "gender": "male", "phone": f"555-{_counter+1:06d}",
    })
    token = (await client.post("/auth/login", json={"email": fresh_email, "password": "Pass123!"})).json()["data"]["access_token"]
    r = await client.get("/admin/equipment", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403
