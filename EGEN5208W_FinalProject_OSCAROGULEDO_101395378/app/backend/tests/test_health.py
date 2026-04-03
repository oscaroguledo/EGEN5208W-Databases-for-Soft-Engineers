"""Tests for / and /health/ endpoints."""
import httpx


def test_root(api: httpx.Client):
    r = api.get("/")
    assert r.status_code == 200
    assert r.json()["status"] == "running"


def test_health_check(api: httpx.Client):
    r = api.get("/health/")
    assert r.status_code == 200
    assert r.json()["data"]["status"] == "healthy"
