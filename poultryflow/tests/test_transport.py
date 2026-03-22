"""Tests for transport: list endpoint, dispatch, arrival."""
import pytest


@pytest.fixture()
def batch(client, auth_headers):
    farm = client.post("/farms/", json={
        "site_id": "TR01", "name": "Transport Farm", "location": "Mumbai",
        "gps_lat": 19.0760, "gps_lng": 72.8777, "capacity": 1000
    }, headers=auth_headers).json()
    return client.post("/batches/", json={
        "farm_id": farm["id"], "batch_code": "TR-BATCH",
        "chick_count": 500, "start_date": "2026-02-01"
    }, headers=auth_headers).json()


@pytest.fixture()
def transport(client, auth_headers, batch):
    r = client.post("/transport/", json={
        "batch_id": batch["id"], "vehicle_number": "MH12AB1234",
        "driver_name": "Raju", "origin": "Farm", "destination": "Plant A",
        "dispatch_time": "2026-03-01T08:00:00"
    }, headers=auth_headers)
    assert r.status_code == 200
    return r.json()


def test_list_transports_empty(client, auth_headers):
    r = client.get("/transport/", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_create_and_list_transport(client, auth_headers, transport):
    r = client.get("/transport/", headers=auth_headers)
    assert r.status_code == 200
    ids = [t["id"] for t in r.json()]
    assert transport["id"] in ids


def test_record_arrival(client, auth_headers, transport):
    r = client.patch(f"/transport/{transport['id']}/arrival",
                     json={"arrival_time": "2026-03-01T12:00:00"},
                     headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["arrival_time"] is not None


def test_double_arrival_rejected(client, auth_headers, transport):
    client.patch(f"/transport/{transport['id']}/arrival",
                 json={"arrival_time": "2026-03-01T12:00:00"}, headers=auth_headers)
    r = client.patch(f"/transport/{transport['id']}/arrival",
                     json={"arrival_time": "2026-03-01T13:00:00"}, headers=auth_headers)
    assert r.status_code == 400


def test_duplicate_transport_per_batch_rejected(client, auth_headers, batch, transport):
    r = client.post("/transport/", json={
        "batch_id": batch["id"], "vehicle_number": "DL1CY9999",
        "origin": "Farm", "destination": "Plant B",
        "dispatch_time": "2026-03-02T08:00:00"
    }, headers=auth_headers)
    assert r.status_code == 400
