from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas.auth import LoginRequest, TokenResponse
from schemas.user import UserCreate, UserRead
from services.auth import authenticate_user
from crud.user import user

router = APIRouter()

@router.post("/register", response_model=UserRead)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Quick route for onboarding the first admin
    return user.create(db, obj_in=user_in)

@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    return authenticate_user(db, login_data=login_data)
