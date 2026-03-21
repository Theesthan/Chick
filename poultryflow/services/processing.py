from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from crud.processing import processing
from crud.batch import batch
from schemas.processing import ProcessingCreate
from models.processing import Processing


def record_processing(db: Session, *, processing_in: ProcessingCreate, user_id: str) -> Processing:
    db_batch = batch.get(db, id=processing_in.batch_id)
    if not db_batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    existing = processing.get_by_batch(db, batch_id=processing_in.batch_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Processing record already exists for this batch",
        )

    # Validate that breakdown doesn't exceed inward weight
    total_breakdown = (
        processing_in.wings_kg
        + processing_in.legs_kg
        + processing_in.breast_kg
        + processing_in.lollipop_kg
        + processing_in.waste_kg
    )
    
    # allow a tiny margin of float error (0.01)
    if total_breakdown > (processing_in.inward_weight + 0.01):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Breakdown total ({total_breakdown:.2f} kg) exceeds inward weight ({processing_in.inward_weight} kg)",
        )

    return processing.create_with_processor(db, obj_in=processing_in, processed_by=user_id)


def get_processing(db: Session, *, batch_id: str) -> Processing:
    db_processing = processing.get_by_batch(db, batch_id=batch_id)
    if not db_processing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No processing record for this batch")
    return db_processing
