from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserRole
from schemas.user import UserRead
from core.deps import get_current_user, require_role

router = APIRouter()

@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/", response_model=list[UserRead])
def get_users(
    skip: int = 0, 
    limit: int = 50, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_role(UserRole.admin))
):
    from crud.user import user
    return user.get_multi(db, skip=skip, limit=limit)
