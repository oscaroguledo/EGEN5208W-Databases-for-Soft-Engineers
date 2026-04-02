"""Tests for /auth/* endpoints."""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


# ── helpers ────────────────────────────────────────────────────────────────

async def _make_member(client: AsyncClient, email="auth_member@test.com", pw="Pass123!"):
    r = await client.post("/members/register", json={
        "email": email, "password": pw,
        "full_name": "Auth Member", "date_of_birth": "1990-01-01",
        "gender": "male", "phone": f"555-{email[:4]}",
    })
    assert r.status_code == 200, r.text
    return email, pw


async def _login(client: AsyncClient, email: str, pw: str) -> dict:
    r = await client.post("/auth/login", json={"email": email, "password": pw})
    assert r.status_code == 200, r.text
    return r.json()["data"]


# ── login ──────────────────────────────────────────────────────────────────

async def test_login_success(client: AsyncClient):
    email, pw = await _make_member(client, "login_ok@test.com")
    data = await _login(client, email, pw)
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == email
    assert data["user"]["role"] == "member"


async def test_login_wrong_password(client: AsyncClient):
    await _make_member(client, "login_bad@test.com")
    r = await client.post("/auth/login", json={"email": "login_bad@test.com", "password": "wrong"})
    assert r.status_code == 401


async def test_login_unknown_email(client: AsyncClient):
    r = await client.post("/auth/login", json={"email": "nobody@test.com", "password": "x"})
    assert r.status_code == 401


# ── /auth/me ───────────────────────────────────────────────────────────────

async def test_me_with_valid_token(client: AsyncClient):
    email, pw = await _make_member(client, "me_ok@test.com")
    tokens = await _login(client, email, pw)
    r = await client.get("/auth/me", headers={"Authorization": f"Bearer {tokens['access_token']}"})
    assert r.status_code == 200
    assert r.json()["data"]["email"] == email


async def test_me_without_token(client: AsyncClient):
    r = await client.get("/auth/me")
    assert r.status_code == 401


async def test_me_with_garbage_token(client: AsyncClient):
    r = await client.get("/auth/me", headers={"Authorization": "Bearer notavalidtoken"})
    assert r.status_code == 401


# ── /auth/verify ───────────────────────────────────────────────────────────

async def test_verify_valid_token(client: AsyncClient):
    email, pw = await _make_member(client, "verify_ok@test.com")
    tokens = await _login(client, email, pw)
    r = await client.get("/auth/verify", headers={"Authorization": f"Bearer {tokens['access_token']}"})
    assert r.status_code == 200
    assert r.json()["data"]["valid"] is True


async def test_verify_no_token(client: AsyncClient):
    r = await client.get("/auth/verify")
    assert r.status_code == 200
    assert r.json()["data"]["valid"] is False


# ── /auth/logout ───────────────────────────────────────────────────────────

async def test_logout_blacklists_token(client: AsyncClient):
    email, pw = await _make_member(client, "logout_ok@test.com")
    tokens = await _login(client, email, pw)
    token = tokens["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Logout
    r = await client.post("/auth/logout", headers=headers)
    assert r.status_code == 200
    assert r.json()["data"]["revoked"] is True

    # Token should now be rejected
    r2 = await client.get("/auth/me", headers=headers)
    assert r2.status_code == 401


async def test_logout_without_token(client: AsyncClient):
    r = await client.post("/auth/logout")
    assert r.status_code == 200   # graceful — no token is fine


# ── /auth/refresh ──────────────────────────────────────────────────────────

async def test_refresh_returns_new_access_token(client: AsyncClient):
    email, pw = await _make_member(client, "refresh_ok@test.com")
    tokens = await _login(client, email, pw)

    r = await client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert r.status_code == 200
    new_token = r.json()["data"]["access_token"]
    assert new_token  # non-empty
    assert new_token != tokens["access_token"]  # actually a new token


async def test_refresh_with_access_token_fails(client: AsyncClient):
    """Passing an access token to /refresh must fail (wrong type claim)."""
    email, pw = await _make_member(client, "refresh_bad@test.com")
    tokens = await _login(client, email, pw)
    r = await client.post("/auth/refresh", json={"refresh_token": tokens["access_token"]})
    assert r.status_code == 401


async def test_refresh_with_garbage_fails(client: AsyncClient):
    r = await client.post("/auth/refresh", json={"refresh_token": "garbage"})
    assert r.status_code == 401


# ── /auth/logout-all ───────────────────────────────────────────────────────

async def test_logout_all(client: AsyncClient):
    email, pw = await _make_member(client, "logout_all@test.com")
    tokens = await _login(client, email, pw)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    r = await client.post("/auth/logout-all", headers=headers)
    assert r.status_code == 200
    assert r.json()["data"]["revoked"] is True

    # Token should be blacklisted
    r2 = await client.get("/auth/me", headers=headers)
    assert r2.status_code == 401
