from datetime import datetime
from pydantic import BaseModel, field_validator


class FarmCreate(BaseModel):
    site_id: str
    name: str
    location: str
    gps_lat: float
    gps_lng: float
    capacity: int

    @field_validator("gps_lat")
    @classmethod
    def validate_lat(cls, v: float) -> float:
        if not (-90.0 <= v <= 90.0):
            raise ValueError("Latitude must be between -90 and 90")
        return v

    @field_validator("gps_lng")
    @classmethod
    def validate_lng(cls, v: float) -> float:
        if not (-180.0 <= v <= 180.0):
            raise ValueError("Longitude must be between -180 and 180")
        return v

    @field_validator("capacity")
    @classmethod
    def validate_capacity(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Capacity must be positive")
        return v


class FarmUpdate(BaseModel):
    name: str | None = None
    location: str | None = None
    capacity: int | None = None


class FarmRead(BaseModel):
    id: str
    site_id: str
    name: str
    location: str
    gps_lat: float
    gps_lng: float
    capacity: int
    created_by: str
    created_at: datetime

    model_config = {"from_attributes": True}
