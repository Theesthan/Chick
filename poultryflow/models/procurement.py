from sqlalchemy import Column, String, Float, Enum, DateTime
from sqlalchemy.orm import relationship
from models.base import Base, TimestampMixin, gen_uuid
# ItemType is the single source of truth — defined in models.inventory
from models.inventory import ItemType  # noqa: F401 (re-exported for backward-compat imports)


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
