from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from models.base import Base, TimestampMixin, gen_uuid


class Sale(Base, TimestampMixin):
    __tablename__ = "sales"

    id = Column(String, primary_key=True, default=gen_uuid)
    batch_id = Column(String, ForeignKey("batches.id"), nullable=False)
    buyer_name = Column(String(150), nullable=False)
    total_weight = Column(Float, nullable=False)   # kg
    price_per_kg = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)   # total_weight * price_per_kg
    sold_at = Column(DateTime(timezone=True), nullable=False)
    notes = Column(String(255), nullable=True)

    # relationships
    batch = relationship("Batch", back_populates="sales")
