from datetime import datetime
from pydantic import BaseModel, field_validator


class WeighingCreate(BaseModel):
    batch_id: str
    gross_weight: float
    tare_weight: float
    notes: str | None = None

    @field_validator("gross_weight", "tare_weight")
    @classmethod
    def validate_positive(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Weight cannot be negative")
        return v


class WeighingRead(BaseModel):
    id: str
    batch_id: str
    gross_weight: float
    tare_weight: float
    net_weight: float
    notes: str | None
    recorded_by: str
    created_at: datetime

    model_config = {"from_attributes": True}
