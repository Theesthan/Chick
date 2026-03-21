import enum
from sqlalchemy import Column, String, Float, Integer, Enum, DateTime
from sqlalchemy.orm import relationship
from models.base import Base, TimestampMixin, gen_uuid


class ItemType(str, enum.Enum):
    feed = "feed"
    medicine = "medicine"
    chicks = "chicks"


class Procurement(Base, TimestampMixin):
    __tablename__ = "procurement"

    id = Column(String, primary_key=True, default=gen_uuid)
    item_type = Column(Enum(ItemType), nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String(30), nullable=False)   # kg, litres, count
    unit_price = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)  # quantity * unit_price
    supplier = Column(String(150), nullable=True)
    purchased_at = Column(DateTime(timezone=True), nullable=False)

    # relationships
    inventory_transactions = relationship("InventoryTransaction", back_populates="procurement")
