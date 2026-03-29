from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserRole
from schemas.batch import BatchCreate, BatchUpdate, BatchRead
from core.deps import require_role
from services import batch as batch_service

router = APIRouter()

@router.post("/", response_model=BatchRead)
def create_batch(
    batch_in: BatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    return batch_service.create_batch(db, batch_in=batch_in)

@router.get("/{batch_id}", response_model=BatchRead)
def get_batch(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.supervisor, UserRole.operator))
):
    return batch_service.get_batch(db, batch_id=batch_id)

@router.get("/", response_model=list[BatchRead])
def list_batches(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.supervisor, UserRole.operator))
):
    return batch_service.list_batches(db, skip=skip, limit=limit)

@router.patch("/{batch_id}", response_model=BatchRead)
def update_batch(
    batch_id: str,
    batch_in: BatchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    return batch_service.update_batch(db, batch_id=batch_id, batch_in=batch_in)
