import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from crud.weighing import weighing
from crud.batch import batch
from schemas.weighing import WeighingCreate
from models.weighing import Weighing
from models.batch import BatchStatus

logger = logging.getLogger(__name__)


def record_weighing(db: Session, *, weighing_in: WeighingCreate, user_id: str) -> Weighing:
    db_batch = batch.get(db, id=weighing_in.batch_id)
    if not db_batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    # State-machine guard: weighing is only valid while the batch is active
    if db_batch.status != BatchStatus.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot record weighing: batch status is '{db_batch.status}'. Only active batches can be weighed.",
        )

    if weighing_in.tare_weight >= weighing_in.gross_weight:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid weight: Tare weight must be less than gross weight",
        )

    db_weighing = weighing.create_with_recorder(db, obj_in=weighing_in, recorded_by=user_id)

    # Deduct mortality from the batch's own live-chick count, NOT the global inventory.
    # Chicks were already issued out of global inventory when the batch was created;
    # mortality only affects how many birds remain alive on this specific batch.
    if weighing_in.mortality > 0 and db_batch.remaining_chicks is not None:
        new_remaining = max(0, db_batch.remaining_chicks - weighing_in.mortality)
        batch.update(db, db_obj=db_batch, obj_in={"remaining_chicks": new_remaining})
        logger.info(
            "Batch %s remaining_chicks updated: %d → %d (mortality at harvest)",
            db_batch.id[:8], db_batch.remaining_chicks, new_remaining,
        )

    # Transition batch: active → harvested
    batch.update(db, db_obj=db_batch, obj_in={"status": BatchStatus.harvested})
    logger.info("Batch %s transitioned active → harvested", db_batch.id[:8])

    return db_weighing


def list_weighings(
    db: Session,
    batch_id: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Weighing]:
    query = db.query(Weighing)
    if batch_id:
        query = query.filter(Weighing.batch_id == batch_id)
    return query.order_by(Weighing.created_at.desc()).offset(skip).limit(limit).all()
