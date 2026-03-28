from sqlalchemy.orm import Session
from crud.base import CRUDBase
from models.inventory import InventoryTransaction, ItemType
from schemas.inventory import InventoryInwardCreate, InventoryIssueCreate
from models.inventory import TransactionType


class CRUDInventory(CRUDBase[InventoryTransaction]):

    def _get_balance_for_update(self, db: Session, item_type: ItemType) -> float:
        """Read the latest running balance with a row-level lock (SELECT FOR UPDATE).

        This prevents two concurrent transactions from reading the same balance,
        both computing their new balance_after, and creating divergent ledger rows.
        If there are no rows yet the balance is 0 — no lock is needed in that case.
        """
        latest = (
            db.query(InventoryTransaction)
            .filter(InventoryTransaction.item_type == item_type)
            .order_by(InventoryTransaction.created_at.desc())
            .with_for_update()
            .first()
        )
        return latest.balance_after if latest else 0.0

    def create_inward(self, db: Session, *, obj_in: InventoryInwardCreate) -> InventoryTransaction:
        current_balance = self._get_balance_for_update(db, item_type=obj_in.item_type)
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

    def create_issue(self, db: Session, *, obj_in: InventoryIssueCreate) -> InventoryTransaction:
        current_balance = self._get_balance_for_update(db, item_type=obj_in.item_type)
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

    def get_latest_balance(self, db: Session, item_type: ItemType) -> float:
        """Non-locking balance read used for display / pre-flight checks."""
        latest = (
            db.query(InventoryTransaction)
            .filter(InventoryTransaction.item_type == item_type)
            .order_by(InventoryTransaction.created_at.desc())
            .first()
        )
        return latest.balance_after if latest else 0.0


inventory = CRUDInventory(InventoryTransaction)
