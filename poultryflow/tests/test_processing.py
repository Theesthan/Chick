"""Tests for processing: shelf life, breakdown validation."""
import pytest


@pytest.fixture()
def batch(client, auth_headers):
    farm = client.post("/farms/", json={
        "site_id": "PC01", "name": "Proc Farm", "location": "Pune",
        "gps_lat": 18.5204, "gps_lng": 73.8567, "capacity": 2000
    }, headers=auth_headers).json()
    return client.post("/batches/", json={
        "farm_id": farm["id"], "batch_code": "PROC-BATCH",
        "chick_count": 600, "start_date": "2026-02-01"
    }, headers=auth_headers).json()


def test_create_processing_with_shelf_life(client, auth_headers, batch):
    r = client.post("/processing/", json={
        "batch_id": batch["id"],
        "farm_weight": 1200.0, "inward_weight": 1150.0,
        "wings_kg": 100, "legs_kg": 200, "breast_kg": 400,
        "lollipop_kg": 150, "waste_kg": 100,
        "shelf_life_days": 5,
    }, headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["shelf_life_days"] == 5
    assert data["loss"] == pytest.approx(50.0, abs=0.01)


def test_breakdown_exceeds_inward_rejected(client, auth_headers, batch):
    r = client.post("/processing/", json={
        "batch_id": batch["id"],
        "farm_weight": 1000.0, "inward_weight": 900.0,
        "wings_kg": 300, "legs_kg": 300, "breast_kg": 300,
        "lollipop_kg": 200, "waste_kg": 200,  # total = 1300 > 900
    }, headers=auth_headers)
    assert r.status_code == 400


def test_negative_breakdown_rejected(client, auth_headers, batch):
    r = client.post("/processing/", json={
        "batch_id": batch["id"],
        "farm_weight": 1000.0, "inward_weight": 900.0,
        "wings_kg": -50, "legs_kg": 200, "breast_kg": 300,
        "lollipop_kg": 100, "waste_kg": 100,
    }, headers=auth_headers)
    assert r.status_code == 422


def test_invalid_shelf_life_rejected(client, auth_headers, batch):
    r = client.post("/processing/", json={
        "batch_id": batch["id"],
        "farm_weight": 1000.0, "inward_weight": 900.0,
        "shelf_life_days": 0,  # invalid
    }, headers=auth_headers)
    assert r.status_code == 422


def test_get_processing(client, auth_headers, batch):
    client.post("/processing/", json={
        "batch_id": batch["id"],
        "farm_weight": 800.0, "inward_weight": 780.0,
        "shelf_life_days": 3,
    }, headers=auth_headers)
    r = client.get(f"/processing/{batch['id']}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["batch_id"] == batch["id"]
