from sqlalchemy.orm import Session
from crud.base import CRUDBase
from models.batch import Batch
from schemas.batch import BatchCreate, BatchUpdate


class CRUDBatch(CRUDBase[Batch]):
    def create(self, db: Session, *, obj_in: BatchCreate) -> Batch:
        db_obj = Batch(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: Batch, obj_in: BatchUpdate | dict) -> Batch:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        return super().update(db, db_obj=db_obj, updates=update_data)


batch = CRUDBatch(Batch)
