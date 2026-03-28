from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from crud.inventory import inventory
from crud.batch import batch
from crud.procurement import procurement
from schemas.inventory import InventoryInwardCreate, InventoryIssueCreate
from models.inventory import InventoryTransaction, ItemType


def add_stock(db: Session, *, inward_in: InventoryInwardCreate) -> InventoryTransaction:
    db_proc = procurement.get(db, id=inward_in.procurement_id)
    if not db_proc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Procurement record not found")

    # Both sides are now ItemType enums — direct equality comparison, no .value needed
    if db_proc.item_type != inward_in.item_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Item type mismatch. Procurement is '{db_proc.item_type.value}', "
                f"but adding '{inward_in.item_type.value}'"
            ),
        )

    # Balance fetch + lock happens atomically inside create_inward
    return inventory.create_inward(db, obj_in=inward_in)


def issue_stock(db: Session, *, issue_in: InventoryIssueCreate) -> InventoryTransaction:
    db_batch = batch.get(db, id=issue_in.batch_id)
    if not db_batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    # Pre-flight check (non-locked) — gives a friendly 400 before hitting the DB lock
    current_balance = inventory.get_latest_balance(db, item_type=issue_in.item_type)
    if current_balance < issue_in.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Insufficient stock for '{issue_in.item_type.value}'. "
                f"Current balance: {current_balance}, Requested: {issue_in.quantity}"
            ),
        )

    # Balance fetch + lock happens atomically inside create_issue
    return inventory.create_issue(db, obj_in=issue_in)


def get_current_stock(db: Session, item_type: ItemType) -> float:
    return inventory.get_latest_balance(db, item_type=item_type)


def list_transactions(
    db: Session,
    item_type: ItemType | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[InventoryTransaction]:
    query = db.query(InventoryTransaction)
    if item_type:
        query = query.filter(InventoryTransaction.item_type == item_type)
    return query.order_by(InventoryTransaction.created_at.desc()).offset(skip).limit(limit).all()
