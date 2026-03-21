from sqlalchemy.orm import Session
from crud.base import CRUDBase
from models.daily_report import DailyReport, ReportStatus
from schemas.daily_report import DailyReportCreate


class CRUDDailyReport(CRUDBase[DailyReport]):
    def create_with_reporter(self, db: Session, *, obj_in: DailyReportCreate, reported_by: str, gps_valid: bool) -> DailyReport:
        db_obj = DailyReport(
            **obj_in.model_dump(),
            reported_by=reported_by,
            gps_valid=gps_valid,
            status=ReportStatus.pending,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def verify(self, db: Session, *, db_obj: DailyReport, status: ReportStatus, verified_by: str, rejection_reason: str | None = None) -> DailyReport:
        db_obj.status = status
        db_obj.verified_by = verified_by
        db_obj.rejection_reason = rejection_reason
        db.commit()
        db.refresh(db_obj)
        return db_obj


daily_report = CRUDDailyReport(DailyReport)
