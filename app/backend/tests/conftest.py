"""
Integration test configuration.

Tests run against the live Docker containers (backend on localhost:8000,
postgres via docker exec). No SQLAlchemy in tests — pure HTTP.

Cleanup: TRUNCATE all data tables before each test via docker exec psql.
"""
import subprocess
import pytest
import httpx

BASE_URL = "http://localhost:8000"

TRUNCATE_SQL = (
    "TRUNCATE enrollments, training_sessions, trainer_availability, "
    "health_metrics, fitness_goals, payments, member_subscriptions, "
    "equipments, classes, rooms, admin_staff, trainers, members, users "
    "RESTART IDENTITY CASCADE;"
)


def _truncate():
    """Truncate all data tables via docker exec."""
    subprocess.run(
        [
            "docker", "exec", "app-postgres-1",
            "psql", "-U", "gym_user", "-d", "gym_db", "-c", TRUNCATE_SQL,
        ],
        check=True,
        capture_output=True,
    )


@pytest.fixture(autouse=True)
def clean_db():
    """Wipe all data before every test."""
    _truncate()
    yield


@pytest.fixture
def api():
    """Synchronous httpx client pointed at the running backend."""
    with httpx.Client(base_url=BASE_URL, timeout=10) as client:
        yield client


# ── shared helpers used across test modules ────────────────────────────────

def register_member(api: httpx.Client, email: str, password: str = "Pass123!",
                    full_name: str = "Test Member") -> dict:
    phone = f"555-{abs(hash(email)) % 10_000_000:07d}"
    r = api.post("/members/register", json={
        "email": email, "password": password,
        "full_name": full_name, "date_of_birth": "1990-06-15",
        "gender": "male", "phone": phone,
    })
    assert r.status_code == 200, f"register_member failed: {r.text}"
    return r.json()["data"]


def login(api: httpx.Client, email: str, password: str = "Pass123!") -> dict:
    r = api.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"login failed: {r.text}"
    return r.json()["data"]  # {access_token, refresh_token, user, ...}


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def create_trainer_via_db(email: str, password: str = "Pass123!",
                          full_name: str = "Test Trainer") -> None:
    """Insert a trainer directly into the DB via docker exec psql."""
    import bcrypt
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    # Use a single SQL statement to insert both rows atomically
    sql = f"""
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO users (email, password, role) VALUES ('{email}', '{hashed}', 'trainer') RETURNING id INTO v_id;
  INSERT INTO trainers (id, full_name) VALUES (v_id, '{full_name}');
END $$;
"""
    subprocess.run(
        ["docker", "exec", "app-postgres-1",
         "psql", "-U", "gym_user", "-d", "gym_db", "-c", sql],
        check=True, capture_output=True,
    )


def create_admin_via_db(email: str, password: str = "Pass123!",
                        full_name: str = "Test Admin") -> None:
    """Insert an admin directly into the DB via docker exec psql."""
    import bcrypt
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    sql = f"""
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO users (email, password, role) VALUES ('{email}', '{hashed}', 'admin') RETURNING id INTO v_id;
  INSERT INTO admin_staff (id, full_name) VALUES (v_id, '{full_name}');
END $$;
"""
    subprocess.run(
        ["docker", "exec", "app-postgres-1",
         "psql", "-U", "gym_user", "-d", "gym_db", "-c", sql],
        check=True, capture_output=True,
    )


def create_room_via_db(name: str = "Room A", capacity: int = 20) -> str:
    """Insert a room and return its UUID."""
    sql = f"SELECT id::text FROM rooms WHERE id = (INSERT INTO rooms (name, capacity) VALUES ('{name}', {capacity}) RETURNING id);"
    # Use a CTE to get clean output
    sql = f"WITH r AS (INSERT INTO rooms (name, capacity) VALUES ('{name}', {capacity}) RETURNING id) SELECT id::text FROM r;"
    result = subprocess.run(
        ["docker", "exec", "app-postgres-1",
         "psql", "-U", "gym_user", "-d", "gym_db", "-t", "-A", "-c", sql],
        capture_output=True, text=True, check=True,
    )
    return result.stdout.strip()
