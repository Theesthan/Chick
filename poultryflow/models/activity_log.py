from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from models.base import Base, TimestampMixin, gen_uuid


class ActivityLog(Base, TimestampMixin):
    __tablename__ = "activity_logs"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)   # e.g. "submit_daily_report"
    entity = Column(String(50), nullable=True)     # e.g. "daily_report"
    entity_id = Column(String, nullable=True)
    detail = Column(Text, nullable=True)           # human-readable summary

    user = relationship("User", back_populates="activity_logs")
