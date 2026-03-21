import enum
from sqlalchemy import Column, String, Float, Enum, ForeignKey
from sqlalchemy.orm import relationship
from models.base import Base, TimestampMixin, gen_uuid


class TransactionType(str, enum.Enum):
    inward = "inward"    # stock added via procurement
    issue = "issue"      # stock issued to a batch


class InventoryTransaction(Base, TimestampMixin):
    __tablename__ = "inventory_transactions"

    id = Column(String, primary_key=True, default=gen_uuid)
    item_type = Column(String(30), nullable=False)       # feed / medicine / chicks
    transaction_type = Column(Enum(TransactionType), nullable=False)
    quantity = Column(Float, nullable=False)
    # running balance AFTER this transaction
    balance_after = Column(Float, nullable=False)
    notes = Column(String(255), nullable=True)

    # optional links
    procurement_id = Column(String, ForeignKey("procurement.id"), nullable=True)
    batch_id = Column(String, ForeignKey("batches.id"), nullable=True)

    # relationships
    procurement = relationship("Procurement", back_populates="inventory_transactions")
    batch = relationship("Batch", back_populates="inventory_issues")
