from sqlalchemy.orm import Session
from crud.base import CRUDBase
from models.weighing import Weighing
from schemas.weighing import WeighingCreate


class CRUDWeighing(CRUDBase[Weighing]):
    def create_with_recorder(self, db: Session, *, obj_in: WeighingCreate, recorded_by: str) -> Weighing:
        net_weight = obj_in.gross_weight - obj_in.tare_weight
        data = obj_in.model_dump()
        db_obj = Weighing(
            **data,
            net_weight=net_weight,
            recorded_by=recorded_by,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


weighing = CRUDWeighing(Weighing)
