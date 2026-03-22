"""Tests for weighing: mortality field, net weight validation."""
import pytest


@pytest.fixture()
def batch(client, auth_headers):
    farm = client.post("/farms/", json={
        "site_id": "WG01", "name": "Weighing Farm", "location": "Pune",
        "gps_lat": 18.5204, "gps_lng": 73.8567, "capacity": 2000
    }, headers=auth_headers).json()
    return client.post("/batches/", json={
        "farm_id": farm["id"], "batch_code": "WG-BATCH",
        "chick_count": 500, "start_date": "2026-01-01"
    }, headers=auth_headers).json()


def test_record_weighing_with_mortality(client, auth_headers, batch):
    r = client.post("/weighing/", json={
        "batch_id": batch["id"],
        "gross_weight": 5000.0, "tare_weight": 500.0,
        "mortality": 3,
    }, headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["net_weight"] == pytest.approx(4500.0, abs=0.01)
    assert data["mortality"] == 3


def test_record_weighing_no_mortality(client, auth_headers, batch):
    r = client.post("/weighing/", json={
        "batch_id": batch["id"],
        "gross_weight": 3000.0, "tare_weight": 300.0,
    }, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["mortality"] == 0


def test_negative_mortality_rejected(client, auth_headers, batch):
    r = client.post("/weighing/", json={
        "batch_id": batch["id"],
        "gross_weight": 3000.0, "tare_weight": 300.0,
        "mortality": -5,
    }, headers=auth_headers)
    assert r.status_code == 422


def test_tare_ge_gross_rejected(client, auth_headers, batch):
    r = client.post("/weighing/", json={
        "batch_id": batch["id"],
        "gross_weight": 500.0, "tare_weight": 600.0,
    }, headers=auth_headers)
    assert r.status_code == 400


def test_supervisor_can_record_weighing(client, sup_headers, auth_headers, batch):
    """Supervisors must be able to record weighings."""
    r = client.post("/weighing/", json={
        "batch_id": batch["id"],
        "gross_weight": 2000.0, "tare_weight": 200.0,
        "mortality": 1,
    }, headers=sup_headers)
    assert r.status_code == 200
