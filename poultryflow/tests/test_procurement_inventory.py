"""Tests for procurement and inventory auto-creation."""
import pytest


@pytest.fixture()
def farm_batch(client, auth_headers):
    farm = client.post("/farms/", json={
        "site_id": "INV01", "name": "Inv Farm", "location": "Pune",
        "gps_lat": 18.5204, "gps_lng": 73.8567, "capacity": 3000
    }, headers=auth_headers).json()
    batch = client.post("/batches/", json={
        "farm_id": farm["id"], "batch_code": "INV-BATCH",
        "chick_count": 500, "start_date": "2026-02-01"
    }, headers=auth_headers).json()
    return farm, batch


def test_procurement_creates_inventory(client, auth_headers):
    """Procuring feed should auto-create an inward inventory transaction."""
    r = client.post("/procurement/", json={
        "item_type": "feed", "quantity": 1000, "unit": "kg",
        "unit_price": 25.0, "purchased_at": "2026-03-01T10:00:00"
    }, headers=auth_headers)
    assert r.status_code == 200
    proc = r.json()
    assert proc["item_type"] == "feed"

    # Balance should now reflect the auto-created inward
    balance = client.get("/inventory/balance/feed", headers=auth_headers).json()
    assert balance["current_balance"] >= 1000


def test_issue_stock_reduces_balance(client, auth_headers, farm_batch):
    _, batch = farm_batch
    # First add stock
    client.post("/procurement/", json={
        "item_type": "medicine", "quantity": 50, "unit": "bottles",
        "unit_price": 100.0, "purchased_at": "2026-03-01T10:00:00"
    }, headers=auth_headers)

    before = client.get("/inventory/balance/medicine", headers=auth_headers).json()["current_balance"]
    r = client.post("/inventory/issue", json={
        "item_type": "medicine", "quantity": 10, "batch_id": batch["id"]
    }, headers=auth_headers)
    assert r.status_code == 200
    after = client.get("/inventory/balance/medicine", headers=auth_headers).json()["current_balance"]
    assert after == before - 10


def test_issue_more_than_balance_rejected(client, auth_headers, farm_batch):
    _, batch = farm_batch
    r = client.post("/inventory/issue", json={
        "item_type": "feed", "quantity": 9999999, "batch_id": batch["id"]
    }, headers=auth_headers)
    assert r.status_code == 400


def test_negative_quantity_rejected(client, auth_headers):
    r = client.post("/procurement/", json={
        "item_type": "feed", "quantity": -100, "unit": "kg",
        "unit_price": 25.0, "purchased_at": "2026-03-01T10:00:00"
    }, headers=auth_headers)
    assert r.status_code == 422
