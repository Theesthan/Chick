import math
import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from crud.daily_report import daily_report
from crud.batch import batch
from crud.farm import farm
from crud.inventory import inventory
from schemas.daily_report import DailyReportCreate, DailyReportVerify
from models.daily_report import DailyReport
from models.inventory import TransactionType
from services import activity_log as al

logger = logging.getLogger(__name__)


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (math.sin(delta_phi / 2) ** 2) + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def submit_daily_report(db: Session, *, report_in: DailyReportCreate, user_id: str) -> DailyReport:
    db_batch = batch.get(db, id=report_in.batch_id)
    if not db_batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    db_farm = farm.get(db, id=db_batch.farm_id)
    if not db_farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")

    # GPS Validation: flag as invalid if > 200m away — but do NOT reject submission
    distance = haversine_distance(
        report_in.gps_lat, report_in.gps_lng, db_farm.gps_lat, db_farm.gps_lng
    )
    gps_valid = distance <= 200.0
    if not gps_valid:
        logger.warning(
            "GPS validation soft-fail: %d m from farm %s (user %s)",
            int(distance), db_farm.id, user_id
        )

    db_report = daily_report.create_with_reporter(
        db, obj_in=report_in, reported_by=user_id, gps_valid=gps_valid
    )

    # Auto-deduct mortality from chicks inventory (if mortality > 0)
    if report_in.mortality > 0:
        try:
            current_balance = inventory.get_latest_balance(db, item_type="chicks")
            if current_balance >= report_in.mortality:
                from models.inventory import InventoryTransaction
                txn = InventoryTransaction(
                    item_type="chicks",
                    transaction_type=TransactionType.issue,
                    quantity=report_in.mortality,
                    balance_after=current_balance - report_in.mortality,
                    batch_id=report_in.batch_id,
                    notes=f"Mortality deduction — daily report {db_report.id[:8]}",
                )
                db.add(txn)
                db.commit()
        except Exception as exc:
            logger.warning("Could not auto-deduct mortality from inventory: %s", exc)

    al.log(db, action="submit_daily_report", user_id=user_id, entity="daily_report",
           entity_id=db_report.id,
           detail=f"Batch {db_report.batch_id[:8]} | date={report_in.report_date} mortality={report_in.mortality} feed={report_in.feed_consumed}kg gps_valid={gps_valid}")

    return db_report


def verify_report(db: Session, *, report_id: str, verify_in: DailyReportVerify, admin_id: str) -> DailyReport:
    db_report = daily_report.get(db, id=report_id)
    if not db_report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    return daily_report.verify(
        db,
        db_obj=db_report,
        status=verify_in.status,
        verified_by=admin_id,
        rejection_reason=verify_in.rejection_reason,
    )


def list_reports(db: Session, batch_id: str | None = None, skip: int = 0, limit: int = 50) -> list[DailyReport]:
    query = db.query(DailyReport)
    if batch_id:
        query = query.filter(DailyReport.batch_id == batch_id)
    return query.order_by(DailyReport.report_date.desc()).offset(skip).limit(limit).all()
