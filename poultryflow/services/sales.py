from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from crud.sales import sale
from crud.batch import batch
from schemas.sales import SaleCreate
from models.sales import Sale


def record_sale(db: Session, *, sale_in: SaleCreate) -> Sale:
    db_batch = batch.get(db, id=sale_in.batch_id)
    if not db_batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    return sale.create(db, obj_in=sale_in)


def list_sales(db: Session, batch_id: str | None = None, skip: int = 0, limit: int = 50) -> list[Sale]:
    if batch_id:
        # Check batch existence first
        db_batch = batch.get(db, id=batch_id)
        if not db_batch:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")
        return sale.get_by_batch(db, batch_id=batch_id)
    
    return sale.get_multi(db, skip=skip, limit=limit)
