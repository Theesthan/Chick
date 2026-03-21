from datetime import date, datetime
from pydantic import BaseModel, field_validator
from models.batch import BatchStatus


class BatchCreate(BaseModel):
    farm_id: str
    batch_code: str
    chick_count: int
    start_date: date

    @field_validator("chick_count")
    @classmethod
    def validate_chick_count(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Chick count must be positive")
        return v


class BatchUpdate(BaseModel):
    status: BatchStatus | None = None


class BatchRead(BaseModel):
    id: str
    farm_id: str
    batch_code: str
    chick_count: int
    start_date: date
    status: BatchStatus
    created_at: datetime

    model_config = {"from_attributes": True}
