import math
import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from crud.daily_report import daily_report
from crud.batch import batch
from crud.farm import farm
from schemas.daily_report import DailyReportCreate, DailyReportVerify
from models.daily_report import DailyReport
from models.batch import BatchStatus
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

    # State-machine guard: daily reports are only valid while the batch is active
    if db_batch.status != BatchStatus.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit daily report: batch status is '{db_batch.status}'. Only active batches accept daily reports.",
        )

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

    # Deduct mortality from the batch's own live-chick count, NOT the global inventory.
    # The global inventory ledger tracks stock (procured chicks not yet deployed).
    # Once chicks are on a farm batch, mortality is a batch-level event only.
    if report_in.mortality > 0 and db_batch.remaining_chicks is not None:
        new_remaining = max(0, db_batch.remaining_chicks - report_in.mortality)
        batch.update(db, db_obj=db_batch, obj_in={"remaining_chicks": new_remaining})
        logger.info(
            "Batch %s remaining_chicks updated: %d → %d (daily report mortality)",
            db_batch.id[:8], db_batch.remaining_chicks, new_remaining,
        )

    al.log(
        db, action="submit_daily_report", user_id=user_id, entity="daily_report",
        entity_id=db_report.id,
        detail=(
            f"Batch {db_report.batch_id[:8]} | date={report_in.report_date} "
            f"mortality={report_in.mortality} feed={report_in.feed_consumed}kg gps_valid={gps_valid}"
        ),
    )

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
