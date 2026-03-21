from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserRole
from schemas.sales import SaleCreate, SaleRead
from core.deps import require_role
from services import sales as sales_service

router = APIRouter()

@router.post("/", response_model=SaleRead)
def record_sale(
    sale_in: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    return sales_service.record_sale(db, sale_in=sale_in)

@router.get("/", response_model=list[SaleRead])
def list_sales(
    batch_id: str | None = None,
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    return sales_service.list_sales(db, batch_id=batch_id, skip=skip, limit=limit)
