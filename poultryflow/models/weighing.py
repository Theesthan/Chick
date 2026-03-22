from sqlalchemy import Column, String, Float, Integer, ForeignKey
from sqlalchemy.orm import relationship
from models.base import Base, TimestampMixin, gen_uuid


class Weighing(Base, TimestampMixin):
    __tablename__ = "weighing"

    id = Column(String, primary_key=True, default=gen_uuid)
    batch_id = Column(String, ForeignKey("batches.id"), nullable=False)
    gross_weight = Column(Float, nullable=False)   # in kg
    tare_weight = Column(Float, nullable=False)    # in kg
    # net_weight is computed in the service layer: gross - tare
    # stored here for fast queries
    net_weight = Column(Float, nullable=False)
    mortality = Column(Integer, nullable=False, default=0)
    notes = Column(String(255), nullable=True)
    recorded_by = Column(String, ForeignKey("users.id"), nullable=False)

    # relationships
    batch = relationship("Batch", back_populates="weighings")
    recorder = relationship("User", back_populates="weighings")
