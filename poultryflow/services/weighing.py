from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from crud.weighing import weighing
from crud.batch import batch
from schemas.weighing import WeighingCreate
from models.weighing import Weighing


def record_weighing(db: Session, *, weighing_in: WeighingCreate, user_id: str) -> Weighing:
    db_batch = batch.get(db, id=weighing_in.batch_id)
    if not db_batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    if weighing_in.tare_weight >= weighing_in.gross_weight:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid weight: Tare weight must be less than gross weight",
        )

    return weighing.create_with_recorder(db, obj_in=weighing_in, recorded_by=user_id)


def list_weighings(db: Session, batch_id: str | None = None, skip: int = 0, limit: int = 50) -> list[Weighing]:
    query = db.query(Weighing)
    if batch_id:
        query = query.filter(Weighing.batch_id == batch_id)
    return query.order_by(Weighing.created_at.desc()).offset(skip).limit(limit).all()
