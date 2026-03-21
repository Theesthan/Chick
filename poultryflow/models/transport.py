from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from models.base import Base, TimestampMixin, gen_uuid


class Transport(Base, TimestampMixin):
    __tablename__ = "transport"

    id = Column(String, primary_key=True, default=gen_uuid)
    batch_id = Column(String, ForeignKey("batches.id"), nullable=False, unique=True)
    vehicle_number = Column(String(30), nullable=False)
    driver_name = Column(String(100), nullable=True)
    origin = Column(String(150), nullable=False)
    destination = Column(String(150), nullable=False)
    dispatch_time = Column(DateTime(timezone=True), nullable=False)
    arrival_time = Column(DateTime(timezone=True), nullable=True)

    # relationships
    batch = relationship("Batch", back_populates="transport")
