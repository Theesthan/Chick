from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from core.security import verify_password, create_access_token
from schemas.auth import LoginRequest, TokenResponse
from crud.user import user


def authenticate_user(db: Session, login_data: LoginRequest) -> TokenResponse:
    db_user = user.get_by_email(db, email=login_data.email)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not verify_password(login_data.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not db_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is inactive",
        )
    
    access_token = create_access_token(data={"sub": db_user.id, "role": db_user.role.value})
    return TokenResponse(access_token=access_token)
