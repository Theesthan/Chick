from sqlalchemy.orm import Session
from crud.base import CRUDBase
from models.processing import Processing
from schemas.processing import ProcessingCreate


class CRUDProcessing(CRUDBase[Processing]):
    def create_with_processor(
        self,
        db: Session,
        *,
        obj_in: ProcessingCreate,
        processed_by: str,
        farm_weight: float,
    ) -> Processing:
        # farm_weight is auto-populated by the service layer from Weighing.net_weight sum.
        # loss is always server-computed.
        loss = farm_weight - obj_in.inward_weight
        db_obj = Processing(
            **obj_in.model_dump(),
            farm_weight=farm_weight,
            loss=loss,
            processed_by=processed_by,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_batch(self, db: Session, batch_id: str) -> Processing | None:
        return db.query(Processing).filter(Processing.batch_id == batch_id).first()


processing = CRUDProcessing(Processing)
