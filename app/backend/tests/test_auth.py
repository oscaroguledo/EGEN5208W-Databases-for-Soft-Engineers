"""Tests for /auth/* endpoints."""
import httpx
from tests.conftest import register_member, login, auth_headers


# ── POST /auth/login ───────────────────────────────────────────────────────

def test_login_success(api: httpx.Client):
    register_member(api, "login_ok@test.com")
    data = login(api, "login_ok@test.com")
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "login_ok@test.com"
    assert data["user"]["role"] == "member"
    assert data["expires_in"] > 0


def test_login_wrong_password(api: httpx.Client):
    register_member(api, "login_bad@test.com")
    r = api.post("/auth/login", json={"email": "login_bad@test.com", "password": "wrong"})
    assert r.status_code == 401


def test_login_unknown_email(api: httpx.Client):
    r = api.post("/auth/login", json={"email": "nobody@test.com", "password": "x"})
    assert r.status_code == 401


def test_login_missing_fields(api: httpx.Client):
    r = api.post("/auth/login", json={"email": "x@test.com"})
    assert r.status_code == 422


# ── GET /auth/me ───────────────────────────────────────────────────────────

def test_me_with_valid_token(api: httpx.Client):
    register_member(api, "me_ok@test.com")
    tokens = login(api, "me_ok@test.com")
    r = api.get("/auth/me", headers=auth_headers(tokens["access_token"]))
    assert r.status_code == 200
    assert r.json()["data"]["email"] == "me_ok@test.com"
    assert r.json()["data"]["role"] == "member"


def test_me_without_token(api: httpx.Client):
    r = api.get("/auth/me")
    assert r.status_code == 401


def test_me_with_garbage_token(api: httpx.Client):
    r = api.get("/auth/me", headers=auth_headers("not.a.valid.jwt"))
    assert r.status_code == 401


# ── GET /auth/verify ───────────────────────────────────────────────────────

def test_verify_valid_token(api: httpx.Client):
    register_member(api, "verify_ok@test.com")
    tokens = login(api, "verify_ok@test.com")
    r = api.get("/auth/verify", headers=auth_headers(tokens["access_token"]))
    assert r.status_code == 200
    d = r.json()["data"]
    assert d["valid"] is True
    assert d["email"] == "verify_ok@test.com"
    assert d["role"] == "member"


def test_verify_no_token(api: httpx.Client):
    r = api.get("/auth/verify")
    assert r.status_code == 200
    assert r.json()["data"]["valid"] is False


def test_verify_garbage_token(api: httpx.Client):
    r = api.get("/auth/verify", headers=auth_headers("garbage"))
    assert r.status_code == 200
    assert r.json()["data"]["valid"] is False


# ── POST /auth/logout ──────────────────────────────────────────────────────

def test_logout_blacklists_token(api: httpx.Client):
    register_member(api, "logout_ok@test.com")
    tokens = login(api, "logout_ok@test.com")
    token = tokens["access_token"]
    headers = auth_headers(token)

    r = api.post("/auth/logout", headers=headers)
    assert r.status_code == 200
    assert r.json()["data"]["revoked"] is True

    # Token must now be rejected
    r2 = api.get("/auth/me", headers=headers)
    assert r2.status_code == 401


def test_logout_without_token(api: httpx.Client):
    r = api.post("/auth/logout")
    assert r.status_code == 200  # graceful — no token is fine


def test_verify_after_logout_shows_invalid(api: httpx.Client):
    register_member(api, "verify_logout@test.com")
    tokens = login(api, "verify_logout@test.com")
    token = tokens["access_token"]

    api.post("/auth/logout", headers=auth_headers(token))

    r = api.get("/auth/verify", headers=auth_headers(token))
    assert r.json()["data"]["valid"] is False


# ── POST /auth/refresh ─────────────────────────────────────────────────────

def test_refresh_returns_new_access_token(api: httpx.Client):
    register_member(api, "refresh_ok@test.com")
    tokens = login(api, "refresh_ok@test.com")

    r = api.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert r.status_code == 200
    new_token = r.json()["data"]["access_token"]
    assert new_token  # non-empty, valid JWT
    # Verify the new token actually works
    r2 = api.get("/auth/me", headers=auth_headers(new_token))
    assert r2.status_code == 200


def test_new_access_token_works(api: httpx.Client):
    register_member(api, "refresh_use@test.com")
    tokens = login(api, "refresh_use@test.com")

    r = api.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    new_token = r.json()["data"]["access_token"]

    r2 = api.get("/auth/me", headers=auth_headers(new_token))
    assert r2.status_code == 200
    assert r2.json()["data"]["email"] == "refresh_use@test.com"


def test_refresh_with_access_token_fails(api: httpx.Client):
    """Passing an access token to /refresh must fail (wrong type claim)."""
    register_member(api, "refresh_bad@test.com")
    tokens = login(api, "refresh_bad@test.com")
    r = api.post("/auth/refresh", json={"refresh_token": tokens["access_token"]})
    assert r.status_code == 401


def test_refresh_with_garbage_fails(api: httpx.Client):
    r = api.post("/auth/refresh", json={"refresh_token": "garbage"})
    assert r.status_code == 401
