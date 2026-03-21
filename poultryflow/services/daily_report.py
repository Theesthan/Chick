import math
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from crud.daily_report import daily_report
from crud.batch import batch
from crud.farm import farm
from schemas.daily_report import DailyReportCreate, DailyReportVerify
from models.daily_report import DailyReport


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance in meters between two points on the earth."""
    R = 6371000  # Radius of earth in meters
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

    # GPS Validation: Must be within 200 meters of the farm
    distance = haversine_distance(
        report_in.gps_lat, report_in.gps_lng, db_farm.gps_lat, db_farm.gps_lng
    )
    
    gps_valid = distance <= 200.0
    
    # We could reject strictly, but the PRD also allows "GPS within 200m OR QR scan"
    # MVP strictly requires GPS to be valid to submit, or at least flags it
    if not gps_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"GPS validation failed. You are {int(distance)} meters from the farm. Must be within 200m.",
        )

    return daily_report.create_with_reporter(db, obj_in=report_in, reported_by=user_id, gps_valid=gps_valid)


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
