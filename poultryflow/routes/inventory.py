from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserRole
from schemas.inventory import InventoryInwardCreate, InventoryIssueCreate, InventoryTransactionRead, InventoryBalanceRead
from core.deps import require_role
from services import inventory as inventory_service

router = APIRouter()

@router.post("/inward", response_model=InventoryTransactionRead)
def add_inward_stock(
    inward_in: InventoryInwardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    return inventory_service.add_stock(db, inward_in=inward_in)

@router.post("/issue", response_model=InventoryTransactionRead)
def issue_stock(
    issue_in: InventoryIssueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    return inventory_service.issue_stock(db, issue_in=issue_in)

@router.get("/balance/{item_type}", response_model=InventoryBalanceRead)
def get_balance(
    item_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.supervisor))
):
    balance = inventory_service.get_current_stock(db, item_type=item_type)
    return InventoryBalanceRead(item_type=item_type, current_balance=balance)

@router.get("/", response_model=list[InventoryTransactionRead])
def get_transactions(
    item_type: str | None = None,
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    return inventory_service.list_transactions(db, item_type=item_type, skip=skip, limit=limit)
