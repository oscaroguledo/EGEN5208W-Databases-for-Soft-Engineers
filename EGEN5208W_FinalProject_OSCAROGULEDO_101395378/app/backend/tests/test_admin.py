"""Tests for /admin/* endpoints."""
import httpx
from tests.conftest import (
    login, auth_headers, register_member,
    create_admin_via_db, create_trainer_via_db, create_room_via_db,
)


def _admin_token(api, email="admin@test.com"):
    create_admin_via_db(email)
    return login(api, email)["access_token"]


# ── POST /admin/equipment ──────────────────────────────────────────────────

def test_create_equipment(api: httpx.Client):
    token = _admin_token(api, "admin_eq_c@test.com")
    room_id = create_room_via_db("Room-Create")
    r = api.post("/admin/equipment", json={
        "equipment_name": "Treadmill", "room_id": room_id, "status": "operational",
    }, headers=auth_headers(token))
    assert r.status_code == 200, r.text
    assert r.json()["data"]["equipment_name"] == "Treadmill"
    assert "equipment_id" in r.json()["data"]


def test_create_equipment_with_notes(api: httpx.Client):
    token = _admin_token(api, "admin_eq_n@test.com")
    room_id = create_room_via_db("Room-Notes")
    r = api.post("/admin/equipment", json={
        "equipment_name": "Bike", "room_id": room_id,
        "status": "under_repair", "notes": "Chain broken",
    }, headers=auth_headers(token))
    assert r.status_code == 200


def test_create_equipment_invalid_status(api: httpx.Client):
    token = _admin_token(api, "admin_eq_bad@test.com")
    room_id = create_room_via_db("Room-Bad")
    r = api.post("/admin/equipment", json={
        "equipment_name": "X", "room_id": room_id, "status": "broken",
    }, headers=auth_headers(token))
    assert r.status_code == 400


# ── GET /admin/equipment ───────────────────────────────────────────────────

def test_list_equipment(api: httpx.Client):
    token = _admin_token(api, "admin_eq_l@test.com")
    room_id = create_room_via_db("Room-List")
    api.post("/admin/equipment", json={"equipment_name": "Rower", "room_id": room_id},
             headers=auth_headers(token))
    api.post("/admin/equipment", json={"equipment_name": "Elliptical", "room_id": room_id},
             headers=auth_headers(token))

    r = api.get("/admin/equipment", headers=auth_headers(token))
    assert r.status_code == 200
    assert len(r.json()["data"]) == 2
    assert "pagination" in r.json()


def test_list_equipment_filter_by_status(api: httpx.Client):
    token = _admin_token(api, "admin_eq_f@test.com")
    room_id = create_room_via_db("Room-Filter")
    api.post("/admin/equipment", json={"equipment_name": "A", "room_id": room_id, "status": "operational"},
             headers=auth_headers(token))
    api.post("/admin/equipment", json={"equipment_name": "B", "room_id": room_id, "status": "under_repair"},
             headers=auth_headers(token))

    r = api.get("/admin/equipment", params={"status_filter": "operational"}, headers=auth_headers(token))
    assert r.status_code == 200
    assert all(e["status"] == "operational" for e in r.json()["data"])


def test_list_equipment_requires_admin(api: httpx.Client):
    register_member(api, "mem_eq@test.com")
    token = login(api, "mem_eq@test.com")["access_token"]
    assert api.get("/admin/equipment", headers=auth_headers(token)).status_code == 403


# ── PUT /admin/equipment/{id}/status ──────────────────────────────────────

def test_update_equipment_status(api: httpx.Client):
    token = _admin_token(api, "admin_eq_s@test.com")
    room_id = create_room_via_db("Room-Status")
    equip_id = api.post("/admin/equipment", json={"equipment_name": "Bench", "room_id": room_id},
                        headers=auth_headers(token)).json()["data"]["equipment_id"]

    r = api.put(f"/admin/equipment/{equip_id}/status",
                json={"status": "under_repair", "notes": "Needs fixing"},
                headers=auth_headers(token))
    assert r.status_code == 200
    assert r.json()["data"]["status"] == "under_repair"


def test_update_equipment_status_invalid(api: httpx.Client):
    token = _admin_token(api, "admin_eq_si@test.com")
    room_id = create_room_via_db("Room-SI")
    equip_id = api.post("/admin/equipment", json={"equipment_name": "X", "room_id": room_id},
                        headers=auth_headers(token)).json()["data"]["equipment_id"]
    r = api.put(f"/admin/equipment/{equip_id}/status",
                json={"status": "broken"}, headers=auth_headers(token))
    assert r.status_code == 400


# ── PUT /admin/equipment/{id} ──────────────────────────────────────────────

def test_update_equipment_details(api: httpx.Client):
    token = _admin_token(api, "admin_eq_d@test.com")
    room_id = create_room_via_db("Room-Detail")
    equip_id = api.post("/admin/equipment", json={"equipment_name": "Old Name", "room_id": room_id},
                        headers=auth_headers(token)).json()["data"]["equipment_id"]

    r = api.put(f"/admin/equipment/{equip_id}",
                json={"equipment_name": "New Name"},
                headers=auth_headers(token))
    assert r.status_code == 200


# ── DELETE /admin/equipment/{id} ───────────────────────────────────────────

def test_delete_equipment(api: httpx.Client):
    token = _admin_token(api, "admin_eq_del@test.com")
    room_id = create_room_via_db("Room-Del")
    equip_id = api.post("/admin/equipment", json={"equipment_name": "To Delete", "room_id": room_id},
                        headers=auth_headers(token)).json()["data"]["equipment_id"]

    r = api.delete(f"/admin/equipment/{equip_id}", headers=auth_headers(token))
    assert r.status_code == 200

    # Should no longer appear in list
    items = api.get("/admin/equipment", headers=auth_headers(token)).json()["data"]
    assert not any(e["id"] == equip_id for e in items)


def test_delete_nonexistent_equipment(api: httpx.Client):
    token = _admin_token(api, "admin_eq_dne@test.com")
    import uuid
    r = api.delete(f"/admin/equipment/{uuid.uuid4()}", headers=auth_headers(token))
    assert r.status_code == 404


# ── GET /admin/equipment/status-options ───────────────────────────────────

def test_equipment_status_options(api: httpx.Client):
    token = _admin_token(api, "admin_eq_opts@test.com")
    r = api.get("/admin/equipment/status-options", headers=auth_headers(token))
    assert r.status_code == 200
    values = {o["value"] for o in r.json()["data"]}
    assert values == {"operational", "under_repair", "out_of_service"}


# ── POST /admin/classes ────────────────────────────────────────────────────

def test_create_class(api: httpx.Client):
    create_trainer_via_db("trainer_cls@test.com")
    room_id = create_room_via_db("Class Room")
    token = _admin_token(api, "admin_cls@test.com")
    trainer_id = api.get("/trainers/list", headers=auth_headers(token)).json()["data"][0]["id"]

    r = api.post("/admin/classes", json={
        "name": "Yoga", "trainer_id": trainer_id, "room_id": room_id,
        "class_date": "2027-06-01", "start_time": "10:00", "end_time": "11:00",
    }, headers=auth_headers(token))
    assert r.status_code == 200, r.text
    assert "class_id" in r.json()["data"]


def test_create_class_room_conflict(api: httpx.Client):
    create_trainer_via_db("trainer_conflict@test.com")
    room_id = create_room_via_db("Conflict Room")
    token = _admin_token(api, "admin_conflict@test.com")
    trainer_id = api.get("/trainers/list", headers=auth_headers(token)).json()["data"][0]["id"]

    payload = {
        "name": "Class A", "trainer_id": trainer_id, "room_id": room_id,
        "class_date": "2027-07-01", "start_time": "10:00", "end_time": "11:00",
    }
    api.post("/admin/classes", json=payload, headers=auth_headers(token))

    # Same room, overlapping time
    payload["name"] = "Class B"
    r2 = api.post("/admin/classes", json=payload, headers=auth_headers(token))
    assert r2.status_code == 400


# ── GET /admin/sessions/list ───────────────────────────────────────────────

def test_list_sessions(api: httpx.Client):
    token = _admin_token(api, "admin_sess@test.com")
    r = api.get("/admin/sessions/list", headers=auth_headers(token))
    assert r.status_code == 200
    assert isinstance(r.json()["data"], list)
    assert "pagination" in r.json()


def test_list_sessions_requires_admin(api: httpx.Client):
    register_member(api, "mem_sess@test.com")
    token = login(api, "mem_sess@test.com")["access_token"]
    assert api.get("/admin/sessions/list", headers=auth_headers(token)).status_code == 403


# ── GET /admin/payments/list ───────────────────────────────────────────────

def test_list_payments(api: httpx.Client):
    token = _admin_token(api, "admin_pay@test.com")
    r = api.get("/admin/payments/list", headers=auth_headers(token))
    assert r.status_code == 200
    assert isinstance(r.json()["data"], list)
    assert "pagination" in r.json()


def test_list_payments_requires_admin(api: httpx.Client):
    register_member(api, "mem_pay@test.com")
    token = login(api, "mem_pay@test.com")["access_token"]
    assert api.get("/admin/payments/list", headers=auth_headers(token)).status_code == 403
