from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from crud.farm import farm
from schemas.farm import FarmCreate, FarmUpdate
from models.farm import Farm


def create_farm(db: Session, *, farm_in: FarmCreate, user_id: str) -> Farm:
    return farm.create_with_owner(db, obj_in=farm_in, created_by=user_id)


def get_farm(db: Session, *, farm_id: str) -> Farm:
    db_farm = farm.get(db, id=farm_id)
    if not db_farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    return db_farm


def update_farm(db: Session, *, farm_id: str, farm_in: FarmUpdate) -> Farm:
    db_farm = get_farm(db, farm_id=farm_id)
    return farm.update(db, db_obj=db_farm, obj_in=farm_in)


def list_farms(db: Session, skip: int = 0, limit: int = 50) -> list[Farm]:
    return farm.get_multi(db, skip=skip, limit=limit)
