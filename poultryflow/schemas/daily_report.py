from datetime import date, datetime
from pydantic import BaseModel, field_validator
from models.daily_report import ReportStatus


class DailyReportCreate(BaseModel):
    batch_id: str
    report_date: date
    mortality: int
    feed_consumed: float
    gps_lat: float
    gps_lng: float

    @field_validator("mortality")
    @classmethod
    def validate_mortality(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Mortality cannot be negative")
        return v

    @field_validator("feed_consumed")
    @classmethod
    def validate_feed(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Feed consumed cannot be negative")
        return v


class DailyReportVerify(BaseModel):
    status: ReportStatus
    rejection_reason: str | None = None


class DailyReportRead(BaseModel):
    id: str
    batch_id: str
    reported_by: str
    report_date: date
    mortality: int
    feed_consumed: float
    gps_lat: float
    gps_lng: float
    gps_valid: bool
    status: ReportStatus
    verified_by: str | None
    rejection_reason: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
