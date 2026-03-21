import enum
from datetime import date
from sqlalchemy import Column, String, Integer, Float, Date, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
from models.base import Base, TimestampMixin, gen_uuid


class ReportStatus(str, enum.Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"


class DailyReport(Base, TimestampMixin):
    __tablename__ = "daily_reports"

    id = Column(String, primary_key=True, default=gen_uuid)
    batch_id = Column(String, ForeignKey("batches.id"), nullable=False)
    reported_by = Column(String, ForeignKey("users.id"), nullable=False)
    report_date = Column(Date, nullable=False)
    mortality = Column(Integer, nullable=False, default=0)
    feed_consumed = Column(Float, nullable=False)  # in kg

    # GPS submitted at time of report
    gps_lat = Column(Float, nullable=False)
    gps_lng = Column(Float, nullable=False)
    gps_valid = Column(Boolean, nullable=False, default=False)

    status = Column(Enum(ReportStatus), nullable=False, default=ReportStatus.pending)
    verified_by = Column(String, ForeignKey("users.id"), nullable=True)
    rejection_reason = Column(String(255), nullable=True)

    # relationships
    batch = relationship("Batch", back_populates="daily_reports")
    reporter = relationship("User", back_populates="daily_reports", foreign_keys=[reported_by])
    verifier = relationship("User", back_populates="verified_reports", foreign_keys=[verified_by])
