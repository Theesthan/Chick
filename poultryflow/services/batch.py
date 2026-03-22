from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from crud.batch import batch
from crud.farm import farm
from schemas.batch import BatchCreate, BatchUpdate
from models.batch import Batch, BatchStatus


def create_batch(db: Session, *, batch_in: BatchCreate) -> Batch:
    db_farm = farm.get(db, id=batch_in.farm_id)
    if not db_farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")

    # Sum chick_count across all active batches for this farm
    active_batches = db.query(Batch).filter(
        Batch.farm_id == batch_in.farm_id,
        Batch.status == BatchStatus.active,
    ).all()
    active_total = sum(b.chick_count for b in active_batches)

    if active_total + batch_in.chick_count > db_farm.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Total active chicks ({active_total} existing + {batch_in.chick_count} new = "
                f"{active_total + batch_in.chick_count}) would exceed farm capacity ({db_farm.capacity})"
            ),
        )
    return batch.create(db, obj_in=batch_in)


def get_batch(db: Session, *, batch_id: str) -> Batch:
    db_batch = batch.get(db, id=batch_id)
    if not db_batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")
    return db_batch


def update_batch(db: Session, *, batch_id: str, batch_in: BatchUpdate) -> Batch:
    db_batch = get_batch(db, batch_id=batch_id)
    return batch.update(db, db_obj=db_batch, obj_in=batch_in)


def list_batches(db: Session, skip: int = 0, limit: int = 50) -> list[Batch]:
    return batch.get_multi(db, skip=skip, limit=limit)
