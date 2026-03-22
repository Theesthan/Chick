from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from crud.transport import transport
from crud.batch import batch
from schemas.transport import TransportCreate, TransportArrivalUpdate
from models.transport import Transport


def create_transport(db: Session, *, transport_in: TransportCreate) -> Transport:
    db_batch = batch.get(db, id=transport_in.batch_id)
    if not db_batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    from models.batch import BatchStatus
    if db_batch.status != BatchStatus.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transport a batch that is {db_batch.status.value}",
        )

    existing = transport.get_by_batch(db, batch_id=transport_in.batch_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transport record already exists for this batch",
        )

    return transport.create(db, obj_in=transport_in)


def record_arrival(db: Session, *, transport_id: str, update_in: TransportArrivalUpdate) -> Transport:
    db_transport = transport.get(db, id=transport_id)
    if not db_transport:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transport record not found")

    if db_transport.arrival_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arrival time already recorded for this transport",
        )

    return transport.update(db, db_obj=db_transport, updates={"arrival_time": update_in.arrival_time})


def get_transport(db: Session, *, transport_id: str) -> Transport:
    db_transport = transport.get(db, id=transport_id)
    if not db_transport:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transport not found")
    return db_transport


def list_transports(db: Session, skip: int = 0, limit: int = 100) -> list[Transport]:
    return transport.list_all(db, skip=skip, limit=limit)
