from datetime import datetime
from pydantic import BaseModel, field_validator


class SaleCreate(BaseModel):
    batch_id: str
    buyer_name: str
    total_weight: float
    price_per_kg: float
    sold_at: datetime
    notes: str | None = None

    @field_validator("total_weight", "price_per_kg")
    @classmethod
    def validate_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Must be a positive value")
        return v


class SaleRead(BaseModel):
    id: str
    batch_id: str
    buyer_name: str
    total_weight: float
    price_per_kg: float
    total_amount: float
    sold_at: datetime
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
