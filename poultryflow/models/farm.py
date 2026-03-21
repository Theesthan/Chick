from sqlalchemy import Column, String, Float, Integer, ForeignKey
from sqlalchemy.orm import relationship
from models.base import Base, TimestampMixin, gen_uuid


class Farm(Base, TimestampMixin):
    __tablename__ = "farms"

    id = Column(String, primary_key=True, default=gen_uuid)
    site_id = Column(String(50), nullable=False, unique=True, index=True)
    name = Column(String(150), nullable=False)
    location = Column(String(255), nullable=False)
    gps_lat = Column(Float, nullable=False)
    gps_lng = Column(Float, nullable=False)
    capacity = Column(Integer, nullable=False)  # max bird count
    created_by = Column(String, ForeignKey("users.id"), nullable=False)

    # relationships
    creator = relationship("User", back_populates="farms_created", foreign_keys=[created_by])
    batches = relationship("Batch", back_populates="farm")
