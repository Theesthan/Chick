from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserRole
from models.inventory import InventoryTransaction, TransactionType
from schemas.procurement import ProcurementCreate, ProcurementRead
from core.deps import require_role
from crud.procurement import procurement
from crud.inventory import inventory
from services import activity_log as al

router = APIRouter()


@router.post("/", response_model=ProcurementRead)
def create_procurement(
    procurement_in: ProcurementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    db_proc = procurement.create(db, obj_in=procurement_in)

    # Auto-create inventory inward transaction for the procured item
    try:
        current_balance = inventory.get_latest_balance(db, item_type=procurement_in.item_type.value)
        txn = InventoryTransaction(
            item_type=procurement_in.item_type.value,
            transaction_type=TransactionType.inward,
            quantity=procurement_in.quantity,
            balance_after=current_balance + procurement_in.quantity,
            procurement_id=db_proc.id,
            notes=f"Auto-inward from procurement {db_proc.id[:8]}",
        )
        db.add(txn)
        db.commit()
    except Exception:
        pass  # Don't fail procurement if auto-inventory fails

    al.log(db, action="create_procurement", user_id=current_user.id, entity="procurement",
           entity_id=db_proc.id,
           detail=f"{procurement_in.item_type.value} qty={procurement_in.quantity} {procurement_in.unit} @ ₹{procurement_in.unit_price} supplier={procurement_in.supplier}")

    return db_proc


@router.get("/", response_model=list[ProcurementRead])
def list_procurements(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    return procurement.get_multi(db, skip=skip, limit=limit)
