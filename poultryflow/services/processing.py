import logging
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from crud.processing import processing
from crud.batch import batch
from schemas.processing import ProcessingCreate
from models.processing import Processing
from models.weighing import Weighing
from models.batch import BatchStatus

logger = logging.getLogger(__name__)


def record_processing(db: Session, *, processing_in: ProcessingCreate, user_id: str) -> Processing:
    db_batch = batch.get(db, id=processing_in.batch_id)
    if not db_batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    # State-machine guard: processing requires a harvested batch
    if db_batch.status != BatchStatus.harvested:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot record processing: batch status is '{db_batch.status}'. "
                "Batch must be in 'harvested' state (record weighing first)."
            ),
        )

    existing = processing.get_by_batch(db, batch_id=processing_in.batch_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Processing record already exists for this batch",
        )

    # Auto-populate farm_weight from the sum of all Weighing.net_weight for this batch.
    # Operators must NOT re-enter this — it is derived from the weighing records.
    farm_weight_raw = (
        db.query(func.sum(Weighing.net_weight))
        .filter(Weighing.batch_id == processing_in.batch_id)
        .scalar()
    )
    if not farm_weight_raw:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No weighing records found for this batch. Record weighing before processing.",
        )
    farm_weight = float(farm_weight_raw)

    # Two-sided breakdown validation against inward_weight (tolerance ± 0.01 kg).
    # Under-reporting is as harmful as over-reporting — both create phantom/missing stock.
    total_breakdown = (
        processing_in.wings_kg
        + processing_in.legs_kg
        + processing_in.breast_kg
        + processing_in.skinless_curry_cut_kg
        + processing_in.lollipop_kg
        + processing_in.waste_kg
    )
    if abs(total_breakdown - processing_in.inward_weight) > 0.01:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Breakdown total ({total_breakdown:.3f} kg) does not balance against "
                f"inward weight ({processing_in.inward_weight:.3f} kg). "
                f"Difference is {abs(total_breakdown - processing_in.inward_weight):.3f} kg "
                f"(max allowed: 0.01 kg). All product categories must account for the full inward weight."
            ),
        )

    db_processing = processing.create_with_processor(
        db, obj_in=processing_in, processed_by=user_id, farm_weight=farm_weight
    )

    # Transition batch: harvested → closed
    batch.update(db, db_obj=db_batch, obj_in={"status": BatchStatus.closed})
    logger.info("Batch %s transitioned harvested → closed", db_batch.id[:8])

    return db_processing


def get_processing(db: Session, *, batch_id: str) -> Processing:
    db_processing = processing.get_by_batch(db, batch_id=batch_id)
    if not db_processing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No processing record for this batch")
    return db_processing
