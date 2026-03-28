from datetime import date
from sqlalchemy import Column, String, Float, Integer, Date, ForeignKey
from sqlalchemy.orm import relationship
from models.base import Base, TimestampMixin, gen_uuid


class Processing(Base, TimestampMixin):
    __tablename__ = "processing"

    id = Column(String, primary_key=True, default=gen_uuid)
    batch_id = Column(String, ForeignKey("batches.id"), nullable=False, unique=True)

    # weights in kg
    farm_weight = Column(Float, nullable=False)
    inward_weight = Column(Float, nullable=False)
    loss = Column(Float, nullable=False)

    # breakdown (all in kg) — must sum to inward_weight ± 0.01
    wings_kg = Column(Float, nullable=False, default=0.0)
    legs_kg = Column(Float, nullable=False, default=0.0)
    breast_kg = Column(Float, nullable=False, default=0.0)
    skinless_curry_cut_kg = Column(Float, nullable=False, default=0.0)
    lollipop_kg = Column(Float, nullable=False, default=0.0)
    waste_kg = Column(Float, nullable=False, default=0.0)

    # shelf life
    shelf_life_days = Column(Integer, nullable=False, default=3)
    processed_at = Column(Date, nullable=False, default=date.today)

    processed_by = Column(String, ForeignKey("users.id"), nullable=False)

    # relationships
    batch = relationship("Batch", back_populates="processing")
    processor = relationship("User", back_populates="processings")
