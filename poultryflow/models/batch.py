import enum
from datetime import date
from sqlalchemy import Column, String, Integer, Date, Enum, ForeignKey
from sqlalchemy.orm import relationship
from models.base import Base, TimestampMixin, gen_uuid


class BatchStatus(str, enum.Enum):
    active = "active"
    harvested = "harvested"
    closed = "closed"


class Batch(Base, TimestampMixin):
    __tablename__ = "batches"

    id = Column(String, primary_key=True, default=gen_uuid)
    farm_id = Column(String, ForeignKey("farms.id"), nullable=False)
    batch_code = Column(String(50), nullable=False, unique=True, index=True)
    chick_count = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    status = Column(Enum(BatchStatus), nullable=False, default=BatchStatus.active)

    # relationships
    farm = relationship("Farm", back_populates="batches")
    daily_reports = relationship("DailyReport", back_populates="batch")
    weighings = relationship("Weighing", back_populates="batch")
    transport = relationship("Transport", back_populates="batch", uselist=False)
    processing = relationship("Processing", back_populates="batch", uselist=False)
    sales = relationship("Sale", back_populates="batch")
    inventory_issues = relationship("InventoryTransaction", back_populates="batch")
