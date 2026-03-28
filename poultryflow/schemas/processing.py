from datetime import date, datetime
from pydantic import BaseModel, field_validator


class ProcessingCreate(BaseModel):
    batch_id: str
    # farm_weight is NOT accepted from the client — it is auto-populated server-side
    # from the sum of Weighing.net_weight for the batch.
    inward_weight: float
    wings_kg: float = 0.0
    legs_kg: float = 0.0
    breast_kg: float = 0.0
    skinless_curry_cut_kg: float = 0.0
    lollipop_kg: float = 0.0
    waste_kg: float = 0.0
    shelf_life_days: int = 3

    @field_validator("inward_weight")
    @classmethod
    def validate_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Weight must be positive")
        return v

    @field_validator(
        "wings_kg", "legs_kg", "breast_kg",
        "skinless_curry_cut_kg", "lollipop_kg", "waste_kg",
    )
    @classmethod
    def validate_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Breakdown weights cannot be negative")
        return v

    @field_validator("shelf_life_days")
    @classmethod
    def validate_shelf_life(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Shelf life must be at least 1 day")
        return v


class ProcessingRead(BaseModel):
    id: str
    batch_id: str
    farm_weight: float
    inward_weight: float
    loss: float
    wings_kg: float
    legs_kg: float
    breast_kg: float
    skinless_curry_cut_kg: float
    lollipop_kg: float
    waste_kg: float
    shelf_life_days: int
    processed_at: date
    processed_by: str
    created_at: datetime

    model_config = {"from_attributes": True}
