from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserRole
from schemas.daily_report import DailyReportCreate, DailyReportVerify, DailyReportRead
from core.deps import require_role
from services import daily_report as report_service

router = APIRouter()

@router.post("/", response_model=DailyReportRead)
def submit_report(
    report_in: DailyReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.supervisor))
):
    return report_service.submit_daily_report(db, report_in=report_in, user_id=current_user.id)

@router.patch("/{report_id}/verify", response_model=DailyReportRead)
def verify_report(
    report_id: str,
    verify_in: DailyReportVerify,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    return report_service.verify_report(db, report_id=report_id, verify_in=verify_in, admin_id=current_user.id)

@router.get("/", response_model=list[DailyReportRead])
def get_reports(
    batch_id: str | None = None,
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.supervisor))
):
    return report_service.list_reports(db, batch_id=batch_id, skip=skip, limit=limit)
