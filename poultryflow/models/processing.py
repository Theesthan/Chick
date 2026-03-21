from sqlalchemy import Column, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from models.base import Base, TimestampMixin, gen_uuid


class Processing(Base, TimestampMixin):
    __tablename__ = "processing"

    id = Column(String, primary_key=True, default=gen_uuid)
    batch_id = Column(String, ForeignKey("batches.id"), nullable=False, unique=True)

    # weights in kg
    farm_weight = Column(Float, nullable=False)     # total weight at farm before dispatch
    inward_weight = Column(Float, nullable=False)   # weight received at plant
    loss = Column(Float, nullable=False)            # farm_weight - inward_weight

    # breakdown (all in kg)
    wings_kg = Column(Float, nullable=False, default=0.0)
    legs_kg = Column(Float, nullable=False, default=0.0)
    breast_kg = Column(Float, nullable=False, default=0.0)
    lollipop_kg = Column(Float, nullable=False, default=0.0)
    waste_kg = Column(Float, nullable=False, default=0.0)

    processed_by = Column(String, ForeignKey("users.id"), nullable=False)

    # relationships
    batch = relationship("Batch", back_populates="processing")
    processor = relationship("User", back_populates="processings")
