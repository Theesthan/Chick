from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserRole
from core.deps import require_role
from services import reports as reports_service

router = APIRouter()

@router.get("/batch/{batch_id}/performance")
def get_batch_performance(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.supervisor))
):
    return reports_service.get_batch_performance(db, batch_id=batch_id)

@router.get("/batch/{batch_id}/profit")
def get_batch_profit(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    # Profit visibility restricted to admin
    return reports_service.get_batch_profit(db, batch_id=batch_id)
