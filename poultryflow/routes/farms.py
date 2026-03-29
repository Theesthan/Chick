from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserRole
from schemas.farm import FarmCreate, FarmUpdate, FarmRead
from core.deps import require_role
from services import farm as farm_service

router = APIRouter()

@router.post("/", response_model=FarmRead)
def create_farm(
    farm_in: FarmCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    return farm_service.create_farm(db, farm_in=farm_in, user_id=current_user.id)

@router.get("/{farm_id}", response_model=FarmRead)
def get_farm(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.supervisor, UserRole.operator))
):
    return farm_service.get_farm(db, farm_id=farm_id)

@router.get("/", response_model=list[FarmRead])
def list_farms(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.supervisor, UserRole.operator))
):
    return farm_service.list_farms(db, skip=skip, limit=limit)

@router.patch("/{farm_id}", response_model=FarmRead)
def update_farm(
    farm_id: str,
    farm_in: FarmUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    return farm_service.update_farm(db, farm_id=farm_id, farm_in=farm_in)
