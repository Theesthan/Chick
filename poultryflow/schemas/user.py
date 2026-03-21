from datetime import datetime
from pydantic import BaseModel, EmailStr
from models.user import UserRole


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.supervisor


class UserUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None
    role: UserRole | None = None


class UserRead(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
