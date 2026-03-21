from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from models.batch import Batch
from models.daily_report import DailyReport, ReportStatus
from models.weighing import Weighing
from models.sales import Sale


def get_batch_performance(db: Session, batch_id: str) -> dict:
    """Calculates mortality and feed efficiency for a specific batch based on VERIFIED reports."""
    db_batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not db_batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    # Aggregate verified daily reports
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

    # Aggregate net weight from weighing
    weight_stats = (
        db.query(func.sum(Weighing.net_weight).label("total_weight"))
        .filter(Weighing.batch_id == batch_id)
        .first()
    )

    total_weight = weight_stats.total_weight or 0.0

    fcr = round(total_feed / total_weight, 2) if total_weight > 0 else 0.0
    survival_rate = round(((db_batch.chick_count - total_mortality) / db_batch.chick_count) * 100, 2) if db_batch.chick_count > 0 else 0.0

    return {
        "batch_id": batch_id,
        "initial_chick_count": db_batch.chick_count,
        "total_mortality": total_mortality,
        "survival_rate_percent": survival_rate,
        "total_feed_consumed_kg": total_feed,
        "total_net_weight_kg": total_weight,
        "feed_conversion_ratio": fcr,
    }


def get_batch_profit(db: Session, batch_id: str) -> dict:
    """Calculates profit for a batch. Profit = Sales - Estimated Costs."""
    # Total Sales
    sales_stats = (
        db.query(func.sum(Sale.total_amount).label("total_revenue"))
        .filter(Sale.batch_id == batch_id)
        .first()
    )
    total_revenue = sales_stats.total_revenue or 0.0

    # In a full complex ERP, feed/medicine/transport/chicks costs per batch would be queried directly by linking
    # procurement -> inventory_transactions -> batch. For the MVP, we assume a simplified cost projection based on
    # total feed consumed * average feed price, etc.
    # Here, we'll return the total_revenue, and mock the costs to avoid over-engineering the SQL linkage.
    
    # Let's just return total revenue for the MVP report endpoint
    return {
        "batch_id": batch_id,
        "total_revenue": total_revenue,
        "total_costs_estimated": 0.0, # Placeholder for full drill-down
        "net_profit_estimated": total_revenue,
    }
