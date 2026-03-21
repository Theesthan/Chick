from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserRole
from schemas.procurement import ProcurementCreate, ProcurementRead
from core.deps import require_role
from crud.procurement import procurement

router = APIRouter()

@router.post("/", response_model=ProcurementRead)
def create_procurement(
    procurement_in: ProcurementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    # Pass directly to CRUD as procurement has no complex constraints other than basic cost summation
    return procurement.create(db, obj_in=procurement_in)


@router.get("/", response_model=list[ProcurementRead])
def list_procurements(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    return procurement.get_multi(db, skip=skip, limit=limit)
