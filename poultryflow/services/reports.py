from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from models.batch import Batch
from models.daily_report import DailyReport, ReportStatus
from models.weighing import Weighing
from models.sales import Sale
from models.inventory import InventoryTransaction, ItemType, TransactionType
from models.procurement import Procurement


def get_batch_performance(db: Session, batch_id: str) -> dict:
    """Calculates mortality and feed efficiency for a specific batch based on VERIFIED reports."""
    db_batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not db_batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    stats = (
        db.query(
            func.sum(DailyReport.mortality).label("total_mortality"),
            func.sum(DailyReport.feed_consumed).label("total_feed"),
        )
        .filter(DailyReport.batch_id == batch_id)
        .filter(DailyReport.status == ReportStatus.verified)
        .first()
    )

    total_mortality = stats.total_mortality or 0
    total_feed = stats.total_feed or 0.0

    weight_stats = (
        db.query(
            func.sum(Weighing.net_weight).label("total_weight"),
            func.sum(Weighing.mortality).label("weighing_mortality"),
        )
        .filter(Weighing.batch_id == batch_id)
        .first()
    )

    total_weight = weight_stats.total_weight or 0.0
    weighing_mortality = weight_stats.weighing_mortality or 0
    total_mortality += weighing_mortality

    fcr = round(total_feed / total_weight, 2) if total_weight > 0 else 0.0
    survival_rate = (
        round(((db_batch.chick_count - total_mortality) / db_batch.chick_count) * 100, 2)
        if db_batch.chick_count > 0 else 0.0
    )

    return {
        "batch_id": batch_id,
        "initial_chick_count": db_batch.chick_count,
        "total_mortality": total_mortality,
        "survival_rate_percent": survival_rate,
        "total_feed_consumed_kg": total_feed,
        "total_net_weight_kg": total_weight,
        "feed_conversion_ratio": fcr,
    }


def _weighted_avg_unit_price(db: Session, item_type: ItemType) -> float:
    """Global weighted-average unit price across all procurement for an item type."""
    row = db.query(
        func.sum(Procurement.total_cost).label("total_cost"),
        func.sum(Procurement.quantity).label("total_qty"),
    ).filter(Procurement.item_type == item_type).first()
    if row.total_qty and row.total_qty > 0:
        return float(row.total_cost) / float(row.total_qty)
    return 0.0


def get_batch_profit(db: Session, batch_id: str) -> dict:
    """Profit = total_sales_revenue − (chick_cost + feed_cost + medicine_cost + transport_cost).

    Cost methodology:
    - chick_cost:    initial chick_count × weighted-average chick unit price from Procurement
    - feed_cost:     total feed kg issued to this batch × weighted-average feed price
    - medicine_cost: total medicine units issued to this batch × weighted-average medicine price
    - transport_cost: not stored in current schema — returned as 0.0 with a note
    """
    db_batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not db_batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    # --- Revenue ---
    total_revenue = (
        db.query(func.sum(Sale.total_amount))
        .filter(Sale.batch_id == batch_id)
        .scalar()
    ) or 0.0

    # --- Chick cost ---
    chick_unit_price = _weighted_avg_unit_price(db, ItemType.chicks)
    chick_cost = db_batch.chick_count * chick_unit_price

    # --- Feed cost ---
    # Sum of all feed-issue transactions linked to this batch
    feed_issued = (
        db.query(func.sum(InventoryTransaction.quantity))
        .filter(
            InventoryTransaction.batch_id == batch_id,
            InventoryTransaction.item_type == ItemType.feed,
            InventoryTransaction.transaction_type == TransactionType.issue,
        )
        .scalar()
    ) or 0.0
    feed_unit_price = _weighted_avg_unit_price(db, ItemType.feed)
    feed_cost = feed_issued * feed_unit_price

    # --- Medicine cost ---
    medicine_issued = (
        db.query(func.sum(InventoryTransaction.quantity))
        .filter(
            InventoryTransaction.batch_id == batch_id,
            InventoryTransaction.item_type == ItemType.medicine,
            InventoryTransaction.transaction_type == TransactionType.issue,
        )
        .scalar()
    ) or 0.0
    medicine_unit_price = _weighted_avg_unit_price(db, ItemType.medicine)
    medicine_cost = medicine_issued * medicine_unit_price

    # --- Transport cost ---
    # Transport records exist but have no cost field in the current schema.
    # This returns 0.0 until a transport_cost column is added.
    transport_cost = 0.0

    total_costs = chick_cost + feed_cost + medicine_cost + transport_cost
    net_profit = total_revenue - total_costs

    return {
        "batch_id": batch_id,
        "total_revenue": round(total_revenue, 2),
        "chick_procurement_cost": round(chick_cost, 2),
        "feed_cost": round(feed_cost, 2),
        "medicine_cost": round(medicine_cost, 2),
        "transport_cost": transport_cost,  # placeholder — no cost field in Transport model
        "total_costs": round(total_costs, 2),
        "net_profit": round(net_profit, 2),
    }
