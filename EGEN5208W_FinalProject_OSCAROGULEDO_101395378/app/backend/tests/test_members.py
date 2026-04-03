"""Tests for /members/* endpoints."""
import httpx
from tests.conftest import (
    register_member, login, auth_headers,
    create_admin_via_db, create_trainer_via_db, create_room_via_db,
)


# ── POST /members/register ─────────────────────────────────────────────────

def test_register_success(api: httpx.Client):
    data = register_member(api, "reg@test.com", full_name="Jane Doe")
    assert data["full_name"] == "Jane Doe"
    assert "id" in data


def test_register_duplicate_email(api: httpx.Client):
    register_member(api, "dup@test.com")
    r = api.post("/members/register", json={
        "email": "dup@test.com", "password": "Pass123!",
        "full_name": "Dup", "date_of_birth": "1990-01-01",
        "gender": "male", "phone": "555-9999999",
    })
    assert r.status_code == 400


def test_register_missing_fields(api: httpx.Client):
    r = api.post("/members/register", json={"email": "x@test.com"})
    assert r.status_code == 422


# ── GET /members/me ────────────────────────────────────────────────────────

def test_get_me(api: httpx.Client):
    register_member(api, "me@test.com", full_name="My Name")
    token = login(api, "me@test.com")["access_token"]
    r = api.get("/members/me", headers=auth_headers(token))
    assert r.status_code == 200
    assert r.json()["data"]["full_name"] == "My Name"


def test_get_me_unauthenticated(api: httpx.Client):
    assert api.get("/members/me").status_code == 401


# ── PUT /members/me ────────────────────────────────────────────────────────

def test_update_me(api: httpx.Client):
    register_member(api, "upd@test.com")
    token = login(api, "upd@test.com")["access_token"]
    r = api.put("/members/me", json={"full_name": "Updated Name"},
                headers=auth_headers(token))
    assert r.status_code == 200
    assert r.json()["data"]["full_name"] == "Updated Name"


def test_update_me_phone(api: httpx.Client):
    register_member(api, "upd_ph@test.com")
    token = login(api, "upd_ph@test.com")["access_token"]
    r = api.put("/members/me", json={"phone": "555-0000001"},
                headers=auth_headers(token))
    assert r.status_code == 200
    assert r.json()["data"]["phone"] == "555-0000001"


# ── POST /members/goals ────────────────────────────────────────────────────

def test_add_goals(api: httpx.Client):
    register_member(api, "goals@test.com")
    token = login(api, "goals@test.com")["access_token"]
    r = api.post("/members/goals",
                 json=[{"description": "Run 5k", "target_value": "5km"}],
                 headers=auth_headers(token))
    assert r.status_code == 200
    assert len(r.json()["data"]) == 1
    assert r.json()["data"][0]["description"] == "Run 5k"


def test_add_multiple_goals(api: httpx.Client):
    register_member(api, "goals2@test.com")
    token = login(api, "goals2@test.com")["access_token"]
    r = api.post("/members/goals",
                 json=[
                     {"description": "Lose weight", "target_value": "70kg"},
                     {"description": "Run marathon"},
                 ],
                 headers=auth_headers(token))
    assert r.status_code == 200
    assert len(r.json()["data"]) == 2


# ── GET /members/goals/list ────────────────────────────────────────────────

def test_list_goals(api: httpx.Client):
    register_member(api, "glist@test.com")
    token = login(api, "glist@test.com")["access_token"]
    headers = auth_headers(token)
    api.post("/members/goals", json=[{"description": "Goal A"}], headers=headers)
    api.post("/members/goals", json=[{"description": "Goal B"}], headers=headers)
    r = api.get("/members/goals/list", headers=headers)
    assert r.status_code == 200
    assert len(r.json()["data"]) >= 2


# ── POST /members/health-metrics ───────────────────────────────────────────

def test_add_health_metric(api: httpx.Client):
    register_member(api, "hm@test.com")
    token = login(api, "hm@test.com")["access_token"]
    r = api.post("/members/health-metrics",
                 params={"metric_type": "weight", "metric_value": 75.5},
                 headers=auth_headers(token))
    assert r.status_code == 200
    assert "metric_id" in r.json()["data"]


# ── GET /members/health-history ────────────────────────────────────────────

def test_health_history(api: httpx.Client):
    register_member(api, "hh@test.com")
    token = login(api, "hh@test.com")["access_token"]
    headers = auth_headers(token)
    api.post("/members/health-metrics", params={"metric_type": "weight", "metric_value": 80}, headers=headers)
    api.post("/members/health-metrics", params={"metric_type": "bmi", "metric_value": 24.5}, headers=headers)

    r = api.get("/members/health-history", headers=headers)
    assert r.status_code == 200
    assert len(r.json()["data"]) == 2


def test_health_history_filter_by_type(api: httpx.Client):
    register_member(api, "hh2@test.com")
    token = login(api, "hh2@test.com")["access_token"]
    headers = auth_headers(token)
    api.post("/members/health-metrics", params={"metric_type": "weight", "metric_value": 70}, headers=headers)
    api.post("/members/health-metrics", params={"metric_type": "bmi", "metric_value": 22}, headers=headers)

    r = api.get("/members/health-history", params={"metric_type": "bmi"}, headers=headers)
    assert r.status_code == 200
    assert all(m["metric_type"] == "bmi" for m in r.json()["data"])


# ── GET /members/classes/available ────────────────────────────────────────

def test_list_available_classes_empty(api: httpx.Client):
    register_member(api, "cls@test.com")
    token = login(api, "cls@test.com")["access_token"]
    r = api.get("/members/classes/available", headers=auth_headers(token))
    assert r.status_code == 200
    assert isinstance(r.json()["data"], list)


# ── POST /members/enroll-class & DELETE ────────────────────────────────────

def test_enroll_and_cancel_class(api: httpx.Client):
    # Setup: admin creates a class
    create_admin_via_db("admin_enroll@test.com")
    create_trainer_via_db("trainer_enroll@test.com")
    room_id = create_room_via_db("Enroll Room")

    admin_token = login(api, "admin_enroll@test.com")["access_token"]
    trainer_list = api.get("/trainers/list", headers=auth_headers(admin_token)).json()["data"]
    trainer_id = trainer_list[0]["id"]

    cls_r = api.post("/admin/classes", json={
        "name": "Yoga", "trainer_id": trainer_id, "room_id": room_id,
        "class_date": "2027-01-10", "start_time": "09:00", "end_time": "10:00",
    }, headers=auth_headers(admin_token))
    assert cls_r.status_code == 200, cls_r.text
    class_id = cls_r.json()["data"]["class_id"]

    # Member enrolls
    register_member(api, "enroll_mem@test.com")
    mem_token = login(api, "enroll_mem@test.com")["access_token"]

    r = api.post(f"/members/enroll-class/{class_id}", headers=auth_headers(mem_token))
    assert r.status_code == 200
    assert "enrollment_id" in r.json()["data"]

    # Cancel enrollment
    r2 = api.delete(f"/members/enroll-class/{class_id}", headers=auth_headers(mem_token))
    assert r2.status_code == 200
    assert r2.json()["data"]["cancelled"] is True


def test_enroll_duplicate_fails(api: httpx.Client):
    create_admin_via_db("admin_dup_enroll@test.com")
    create_trainer_via_db("trainer_dup_enroll@test.com")
    room_id = create_room_via_db("Dup Enroll Room")

    admin_token = login(api, "admin_dup_enroll@test.com")["access_token"]
    trainer_id = api.get("/trainers/list", headers=auth_headers(admin_token)).json()["data"][0]["id"]

    cls_r = api.post("/admin/classes", json={
        "name": "Pilates", "trainer_id": trainer_id, "room_id": room_id,
        "class_date": "2027-02-10", "start_time": "10:00", "end_time": "11:00",
    }, headers=auth_headers(admin_token))
    class_id = cls_r.json()["data"]["class_id"]

    register_member(api, "dup_enroll_mem@test.com")
    mem_token = login(api, "dup_enroll_mem@test.com")["access_token"]

    api.post(f"/members/enroll-class/{class_id}", headers=auth_headers(mem_token))
    r2 = api.post(f"/members/enroll-class/{class_id}", headers=auth_headers(mem_token))
    assert r2.status_code == 400


# ── POST /members/book-session & DELETE ────────────────────────────────────

def test_book_and_cancel_session(api: httpx.Client):
    create_trainer_via_db("trainer_book@test.com")
    room_id = create_room_via_db("Book Room")

    create_admin_via_db("admin_book@test.com")
    admin_token = login(api, "admin_book@test.com")["access_token"]
    trainer_id = api.get("/trainers/list", headers=auth_headers(admin_token)).json()["data"][0]["id"]

    register_member(api, "book_mem@test.com")
    mem_token = login(api, "book_mem@test.com")["access_token"]

    r = api.post("/members/book-session", params={
        "trainer_id": trainer_id, "room_id": room_id,
        "session_date": "2027-03-15", "start_time": "14:00", "end_time": "15:00",
    }, headers=auth_headers(mem_token))
    assert r.status_code == 200, r.text
    session_id = r.json()["data"]["session_id"]

    r2 = api.delete(f"/members/book-session/{session_id}", headers=auth_headers(mem_token))
    assert r2.status_code == 200
    assert r2.json()["data"]["cancelled"] is True


def test_book_session_overlap_fails(api: httpx.Client):
    create_trainer_via_db("trainer_overlap@test.com")
    room_id = create_room_via_db("Overlap Room")

    create_admin_via_db("admin_overlap@test.com")
    admin_token = login(api, "admin_overlap@test.com")["access_token"]
    trainer_id = api.get("/trainers/list", headers=auth_headers(admin_token)).json()["data"][0]["id"]

    register_member(api, "overlap_mem@test.com")
    mem_token = login(api, "overlap_mem@test.com")["access_token"]

    params = {"trainer_id": trainer_id, "room_id": room_id,
              "session_date": "2027-04-01", "start_time": "10:00", "end_time": "11:00"}
    api.post("/members/book-session", params=params, headers=auth_headers(mem_token))

    # Same time, same member — should fail
    r2 = api.post("/members/book-session", params=params, headers=auth_headers(mem_token))
    assert r2.status_code == 400


# ── GET /members/dashboard ─────────────────────────────────────────────────

def test_dashboard(api: httpx.Client):
    register_member(api, "dash@test.com")
    token = login(api, "dash@test.com")["access_token"]
    r = api.get("/members/dashboard", headers=auth_headers(token))
    assert r.status_code == 200
    data = r.json()["data"]
    assert "upcoming_classes" in data
    assert "upcoming_sessions" in data


# ── GET /members/list (admin only) ─────────────────────────────────────────

def test_list_members_requires_admin(api: httpx.Client):
    register_member(api, "lst_mem@test.com")
    token = login(api, "lst_mem@test.com")["access_token"]
    assert api.get("/members/list", headers=auth_headers(token)).status_code == 403


def test_list_members_as_admin(api: httpx.Client):
    create_admin_via_db("admin_lst@test.com")
    register_member(api, "listed_mem@test.com")
    token = login(api, "admin_lst@test.com")["access_token"]
    r = api.get("/members/list", headers=auth_headers(token))
    assert r.status_code == 200
    assert len(r.json()["data"]) >= 1
