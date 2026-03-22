"""Tests for daily reports: GPS soft-validation and mortality inventory deduction."""
import pytest


@pytest.fixture()
def farm_and_batch(client, auth_headers):
    farm = client.post("/farms/", json={
        "site_id": "DR01", "name": "DR Farm", "location": "Hyderabad",
        "gps_lat": 17.3850, "gps_lng": 78.4867, "capacity": 2000
    }, headers=auth_headers).json()
    batch = client.post("/batches/", json={
        "farm_id": farm["id"], "batch_code": "DR-BATCH-01",
        "chick_count": 800, "start_date": "2026-01-10"
    }, headers=auth_headers).json()
    return farm, batch


def test_submit_report_valid_gps(client, sup_headers, farm_and_batch):
    _, batch = farm_and_batch
    r = client.post("/daily-reports/", json={
        "batch_id": batch["id"], "report_date": "2026-03-01",
        "mortality": 2, "feed_consumed": 120.0,
        "gps_lat": 17.3850, "gps_lng": 78.4867,  # exact match
    }, headers=sup_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["gps_valid"] is True
    assert data["status"] == "pending"


def test_submit_report_invalid_gps_soft_fail(client, sup_headers, farm_and_batch):
    """GPS outside 200m should NOT reject — just flag gps_valid=False."""
    _, batch = farm_and_batch
    r = client.post("/daily-reports/", json={
        "batch_id": batch["id"], "report_date": "2026-03-02",
        "mortality": 0, "feed_consumed": 100.0,
        "gps_lat": 28.6139, "gps_lng": 77.2090,  # New Delhi — far away
    }, headers=sup_headers)
    assert r.status_code == 200          # still accepted
    assert r.json()["gps_valid"] is False


def test_negative_mortality_rejected(client, sup_headers, farm_and_batch):
    _, batch = farm_and_batch
    r = client.post("/daily-reports/", json={
        "batch_id": batch["id"], "report_date": "2026-03-03",
        "mortality": -5, "feed_consumed": 100.0,
        "gps_lat": 17.3850, "gps_lng": 78.4867,
    }, headers=sup_headers)
    assert r.status_code == 422


def test_verify_report(client, auth_headers, sup_headers, farm_and_batch):
    _, batch = farm_and_batch
    report = client.post("/daily-reports/", json={
        "batch_id": batch["id"], "report_date": "2026-03-04",
        "mortality": 1, "feed_consumed": 90.0,
        "gps_lat": 17.3850, "gps_lng": 78.4867,
    }, headers=sup_headers).json()

    r = client.patch(f"/daily-reports/{report['id']}/verify",
                     json={"status": "verified"}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "verified"


def test_reject_report_with_reason(client, auth_headers, sup_headers, farm_and_batch):
    _, batch = farm_and_batch
    report = client.post("/daily-reports/", json={
        "batch_id": batch["id"], "report_date": "2026-03-05",
        "mortality": 0, "feed_consumed": 50.0,
        "gps_lat": 17.3850, "gps_lng": 78.4867,
    }, headers=sup_headers).json()

    r = client.patch(f"/daily-reports/{report['id']}/verify",
                     json={"status": "rejected", "rejection_reason": "Suspicious data"},
                     headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["rejection_reason"] == "Suspicious data"
