from datetime import datetime
from pydantic import BaseModel


class TransportCreate(BaseModel):
    batch_id: str
    vehicle_number: str
    driver_name: str | None = None
    origin: str
    destination: str
    dispatch_time: datetime


class TransportArrivalUpdate(BaseModel):
    """Used when the vehicle arrives at the plant."""
    arrival_time: datetime


class TransportRead(BaseModel):
    id: str
    batch_id: str
    vehicle_number: str
    driver_name: str | None
    origin: str
    destination: str
    dispatch_time: datetime
    arrival_time: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
