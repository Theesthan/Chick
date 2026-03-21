from sqlalchemy.orm import Session
from crud.base import CRUDBase
from models.inventory import InventoryTransaction
from schemas.inventory import InventoryInwardCreate, InventoryIssueCreate
from models.inventory import TransactionType


class CRUDInventory(CRUDBase[InventoryTransaction]):
    def create_inward(self, db: Session, *, obj_in: InventoryInwardCreate, current_balance: float) -> InventoryTransaction:
        balance_after = current_balance + obj_in.quantity
        db_obj = InventoryTransaction(
            item_type=obj_in.item_type,
            transaction_type=TransactionType.inward,
            quantity=obj_in.quantity,
            balance_after=balance_after,
            procurement_id=obj_in.procurement_id,
            notes=obj_in.notes,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def create_issue(self, db: Session, *, obj_in: InventoryIssueCreate, current_balance: float) -> InventoryTransaction:
        balance_after = current_balance - obj_in.quantity
        db_obj = InventoryTransaction(
            item_type=obj_in.item_type,
            transaction_type=TransactionType.issue,
            quantity=obj_in.quantity,
            balance_after=balance_after,
            batch_id=obj_in.batch_id,
            notes=obj_in.notes,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_latest_balance(self, db: Session, item_type: str) -> float:
        latest = (
            db.query(InventoryTransaction)
            .filter(InventoryTransaction.item_type == item_type)
            .order_by(InventoryTransaction.created_at.desc())
            .first()
        )
        return latest.balance_after if latest else 0.0


inventory = CRUDInventory(InventoryTransaction)
