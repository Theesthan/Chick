from sqlalchemy.orm import Session
from crud.base import CRUDBase
from models.sales import Sale
from schemas.sales import SaleCreate


class CRUDSale(CRUDBase[Sale]):
    def create(self, db: Session, *, obj_in: SaleCreate) -> Sale:
        total_amount = obj_in.total_weight * obj_in.price_per_kg
        db_obj = Sale(
            **obj_in.model_dump(),
            total_amount=total_amount,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_batch(self, db: Session, batch_id: str) -> list[Sale]:
        return db.query(Sale).filter(Sale.batch_id == batch_id).all()


sale = CRUDSale(Sale)
