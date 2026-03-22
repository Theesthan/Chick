import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from crud.weighing import weighing
from crud.batch import batch
from crud.inventory import inventory
from schemas.weighing import WeighingCreate
from models.weighing import Weighing
from models.inventory import TransactionType

logger = logging.getLogger(__name__)


def record_weighing(db: Session, *, weighing_in: WeighingCreate, user_id: str) -> Weighing:
    db_batch = batch.get(db, id=weighing_in.batch_id)
    if not db_batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    if weighing_in.tare_weight >= weighing_in.gross_weight:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid weight: Tare weight must be less than gross weight",
        )

    db_weighing = weighing.create_with_recorder(db, obj_in=weighing_in, recorded_by=user_id)

    # Auto-deduct mortality from chick inventory if recorded
    if weighing_in.mortality > 0:
        try:
            current_balance = inventory.get_latest_balance(db, item_type="chicks")
            if current_balance >= weighing_in.mortality:
                from models.inventory import InventoryTransaction
                txn = InventoryTransaction(
                    item_type="chicks",
                    transaction_type=TransactionType.issue,
                    quantity=weighing_in.mortality,
                    balance_after=current_balance - weighing_in.mortality,
                    batch_id=weighing_in.batch_id,
                    notes=f"Mortality at harvest — weighing {db_weighing.id[:8]}",
                )
                db.add(txn)
                db.commit()
        except Exception as exc:
            logger.warning("Could not auto-deduct mortality from inventory: %s", exc)

    return db_weighing


def list_weighings(db: Session, batch_id: str | None = None, skip: int = 0, limit: int = 50) -> list[Weighing]:
    query = db.query(Weighing)
    if batch_id:
        query = query.filter(Weighing.batch_id == batch_id)
    return query.order_by(Weighing.created_at.desc()).offset(skip).limit(limit).all()
