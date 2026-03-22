"""Tests for authentication endpoints."""


def test_register_and_login(client):
    r = client.post("/auth/register", json={
        "name": "Alice", "email": "alice@test.com",
        "password": "secret123", "role": "supervisor"
    })
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == "alice@test.com"
    assert data["role"] == "supervisor"

    r2 = client.post("/auth/login", json={"email": "alice@test.com", "password": "secret123"})
    assert r2.status_code == 200
    assert "access_token" in r2.json()


def test_login_wrong_password(client):
    client.post("/auth/register", json={
        "name": "Bob", "email": "bob@test.com", "password": "correct", "role": "operator"
    })
    r = client.post("/auth/login", json={"email": "bob@test.com", "password": "wrong"})
    assert r.status_code == 401


def test_duplicate_email(client):
    payload = {"name": "Carol", "email": "carol@test.com", "password": "pw", "role": "admin"}
    client.post("/auth/register", json=payload)
    r = client.post("/auth/register", json=payload)
    assert r.status_code == 400


def test_get_me(client, auth_headers):
    r = client.get("/users/me", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["role"] == "admin"


def test_unauthenticated_access(client):
    r = client.get("/farms/")
    assert r.status_code == 401
