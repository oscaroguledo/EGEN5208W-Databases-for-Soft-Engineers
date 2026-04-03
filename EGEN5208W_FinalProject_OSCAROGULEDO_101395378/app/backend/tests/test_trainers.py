"""Tests for /trainers/* endpoints."""
import httpx
from tests.conftest import (
    login, auth_headers, register_member,
    create_trainer_via_db, create_admin_via_db,
)


# ── POST /trainers/availability ────────────────────────────────────────────

def test_set_availability(api: httpx.Client):
    create_trainer_via_db("tr_avail@test.com")
    token = login(api, "tr_avail@test.com")["access_token"]
    r = api.post("/trainers/availability", json={
        "available_date": "2027-05-01",
        "start_at": "09:00",
        "end_at": "12:00",
    }, headers=auth_headers(token))
    assert r.status_code == 200, r.text
    assert "availability_id" in r.json()["data"]


def test_set_multiple_availability_slots(api: httpx.Client):
    create_trainer_via_db("tr_avail2@test.com")
    token = login(api, "tr_avail2@test.com")["access_token"]
    headers = auth_headers(token)
    for day in ["2027-05-01", "2027-05-02", "2027-05-03"]:
        r = api.post("/trainers/availability", json={
            "available_date": day, "start_at": "08:00", "end_at": "17:00",
        }, headers=headers)
        assert r.status_code == 200


def test_availability_requires_trainer_role(api: httpx.Client):
    register_member(api, "mem_avail@test.com")
    token = login(api, "mem_avail@test.com")["access_token"]
    r = api.post("/trainers/availability", json={
        "available_date": "2027-05-01", "start_at": "09:00", "end_at": "12:00",
    }, headers=auth_headers(token))
    assert r.status_code == 403


def test_availability_requires_auth(api: httpx.Client):
    r = api.post("/trainers/availability", json={
        "available_date": "2027-05-01", "start_at": "09:00", "end_at": "12:00",
    })
    assert r.status_code == 401


# ── GET /trainers/schedule ─────────────────────────────────────────────────

def test_get_schedule_empty(api: httpx.Client):
    create_trainer_via_db("tr_sched@test.com")
    token = login(api, "tr_sched@test.com")["access_token"]
    r = api.get("/trainers/schedule", headers=auth_headers(token))
    assert r.status_code == 200
    data = r.json()["data"]
    assert "upcoming_sessions" in data
    assert "upcoming_classes" in data
    assert "availability" in data


def test_schedule_shows_availability(api: httpx.Client):
    create_trainer_via_db("tr_sched2@test.com")
    token = login(api, "tr_sched2@test.com")["access_token"]
    headers = auth_headers(token)

    api.post("/trainers/availability", json={
        "available_date": "2027-06-01", "start_at": "09:00", "end_at": "17:00",
    }, headers=headers)

    r = api.get("/trainers/schedule", params={"days_ahead": 500}, headers=headers)
    assert r.status_code == 200
    assert len(r.json()["data"]["availability"]) >= 1


def test_schedule_unauthenticated(api: httpx.Client):
    assert api.get("/trainers/schedule").status_code == 401


def test_schedule_requires_trainer_role(api: httpx.Client):
    register_member(api, "mem_sched@test.com")
    token = login(api, "mem_sched@test.com")["access_token"]
    assert api.get("/trainers/schedule", headers=auth_headers(token)).status_code == 403


# ── GET /trainers/list (admin only) ───────────────────────────────────────

def test_list_trainers_requires_admin(api: httpx.Client):
    create_trainer_via_db("tr_lst@test.com")
    token = login(api, "tr_lst@test.com")["access_token"]
    assert api.get("/trainers/list", headers=auth_headers(token)).status_code == 403


def test_list_trainers_as_admin(api: httpx.Client):
    create_admin_via_db("admin_tr_lst@test.com")
    create_trainer_via_db("tr_for_list@test.com")
    token = login(api, "admin_tr_lst@test.com")["access_token"]
    r = api.get("/trainers/list", headers=auth_headers(token))
    assert r.status_code == 200
    assert len(r.json()["data"]) >= 1
    assert r.json()["data"][0]["full_name"] == "Test Trainer"
