from datetime import date, datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.user import User, UserRole
from core.deps import require_role
from services import activity_log as log_service

router = APIRouter()


class ActivityLogRead(BaseModel):
    id: str
    user_id: str | None
    action: str
    entity: str | None
    entity_id: str | None
    detail: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DailySummaryRead(BaseModel):
    date: str
    count: int
    summary: str


@router.get("/", response_model=list[ActivityLogRead])
def get_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    return log_service.list_logs(db, skip=skip, limit=limit)


@router.get("/summary", response_model=DailySummaryRead)
def get_daily_summary(
    for_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    return log_service.daily_summary(db, for_date=for_date)
