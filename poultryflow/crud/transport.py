from sqlalchemy.orm import Session
from crud.base import CRUDBase
from models.transport import Transport
from schemas.transport import TransportCreate


class CRUDTransport(CRUDBase[Transport]):
    def create(self, db: Session, *, obj_in: TransportCreate) -> Transport:
        db_obj = Transport(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_batch(self, db: Session, batch_id: str) -> Transport | None:
        return db.query(Transport).filter(Transport.batch_id == batch_id).first()


transport = CRUDTransport(Transport)
