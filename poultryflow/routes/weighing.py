from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserRole
from schemas.weighing import WeighingCreate, WeighingRead
from core.deps import require_role
from services import weighing as weighing_service

router = APIRouter()

@router.post("/", response_model=WeighingRead)
def record_weighing(
    weighing_in: WeighingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.supervisor))
):
    return weighing_service.record_weighing(db, weighing_in=weighing_in, user_id=current_user.id)

@router.get("/", response_model=list[WeighingRead])
def list_weighings(
    batch_id: str | None = None,
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.supervisor))
):
    return weighing_service.list_weighings(db, batch_id=batch_id, skip=skip, limit=limit)
