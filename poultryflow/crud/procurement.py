from sqlalchemy.orm import Session
from crud.base import CRUDBase
from models.procurement import Procurement
from schemas.procurement import ProcurementCreate


class CRUDProcurement(CRUDBase[Procurement]):
    def create(self, db: Session, *, obj_in: ProcurementCreate) -> Procurement:
        total_cost = obj_in.quantity * obj_in.unit_price
        db_obj = Procurement(
            **obj_in.model_dump(),
            total_cost=total_cost,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


procurement = CRUDProcurement(Procurement)
