from datetime import datetime
from pydantic import BaseModel, field_validator
from models.procurement import ItemType


class ProcurementCreate(BaseModel):
    item_type: ItemType
    quantity: float
    unit: str
    unit_price: float
    supplier: str | None = None
    purchased_at: datetime

    @field_validator("quantity", "unit_price")
    @classmethod
    def validate_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Must be a positive number")
        return v


class ProcurementRead(BaseModel):
    id: str
    item_type: ItemType
    quantity: float
    unit: str
    unit_price: float
    total_cost: float
    supplier: str | None
    purchased_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}
