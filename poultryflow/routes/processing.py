from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserRole
from schemas.processing import ProcessingCreate, ProcessingRead
from core.deps import require_role
from services import processing as processing_service

router = APIRouter()

@router.post("/", response_model=ProcessingRead)
def record_processing(
    processing_in: ProcessingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.operator, UserRole.admin))
):
    return processing_service.record_processing(db, processing_in=processing_in, user_id=current_user.id)

@router.get("/{batch_id}", response_model=ProcessingRead)
def get_processing_for_batch(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.supervisor, UserRole.operator))
):
    return processing_service.get_processing(db, batch_id=batch_id)
