from sqlalchemy.orm import Session
from crud.base import CRUDBase
from models.farm import Farm
from schemas.farm import FarmCreate, FarmUpdate


class CRUDFarm(CRUDBase[Farm]):
    def create_with_owner(self, db: Session, *, obj_in: FarmCreate, created_by: str) -> Farm:
        db_obj = Farm(
            **obj_in.model_dump(),
            created_by=created_by,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: Farm, obj_in: FarmUpdate | dict) -> Farm:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        return super().update(db, db_obj=db_obj, updates=update_data)


farm = CRUDFarm(Farm)
