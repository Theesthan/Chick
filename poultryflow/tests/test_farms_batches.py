"""Tests for farms and batches."""
import pytest


@pytest.fixture()
def farm(client, auth_headers):
    r = client.post("/farms/", json={
        "site_id": "FARM001", "name": "Test Farm",
        "location": "Bangalore", "gps_lat": 12.9716, "gps_lng": 77.5946, "capacity": 5000
    }, headers=auth_headers)
    assert r.status_code == 200
    return r.json()


@pytest.fixture()
def batch(client, auth_headers, farm):
    r = client.post("/batches/", json={
        "farm_id": farm["id"], "batch_code": "BATCH-001",
        "chick_count": 1000, "start_date": "2026-01-01"
    }, headers=auth_headers)
    assert r.status_code == 200
    return r.json()


def test_create_farm(client, auth_headers):
    r = client.post("/farms/", json={
        "site_id": "F999", "name": "My Farm",
        "location": "Chennai", "gps_lat": 13.0827, "gps_lng": 80.2707, "capacity": 2000
    }, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["name"] == "My Farm"


def test_list_farms(client, auth_headers, farm):
    r = client.get("/farms/", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()) >= 1


def test_create_batch(client, auth_headers, batch):
    assert batch["batch_code"] == "BATCH-001"
    assert batch["status"] == "active"


def test_negative_chick_count_rejected(client, auth_headers, farm):
    r = client.post("/batches/", json={
        "farm_id": farm["id"], "batch_code": "BAD",
        "chick_count": -100, "start_date": "2026-01-01"
    }, headers=auth_headers)
    assert r.status_code == 422  # validation error


def test_update_batch_status(client, auth_headers, batch):
    r = client.patch(f"/batches/{batch['id']}", json={"status": "harvested"}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "harvested"


def test_supervisor_cannot_create_farm(client, sup_headers):
    r = client.post("/farms/", json={
        "site_id": "X1", "name": "X", "location": "X",
        "gps_lat": 0, "gps_lng": 0, "capacity": 1
    }, headers=sup_headers)
    assert r.status_code == 403
