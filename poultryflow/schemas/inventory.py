from datetime import datetime
from pydantic import BaseModel, field_validator
from models.inventory import TransactionType


class InventoryInwardCreate(BaseModel):
    """Add stock via procurement linkage."""
    item_type: str
    quantity: float
    procurement_id: str
    notes: str | None = None

    @field_validator("quantity")
    @classmethod
    def validate_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Quantity must be positive")
        return v


class InventoryIssueCreate(BaseModel):
    """Issue stock to a batch."""
    item_type: str
    quantity: float
    batch_id: str
    notes: str | None = None

    @field_validator("quantity")
    @classmethod
    def validate_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Quantity must be positive")
        return v


class InventoryTransactionRead(BaseModel):
    id: str
    item_type: str
    transaction_type: TransactionType
    quantity: float
    balance_after: float
    notes: str | None
    procurement_id: str | None
    batch_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class InventoryBalanceRead(BaseModel):
    item_type: str
    current_balance: float
