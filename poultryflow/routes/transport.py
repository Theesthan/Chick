from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserRole
from schemas.transport import TransportCreate, TransportArrivalUpdate, TransportRead
from core.deps import require_role
from services import transport as transport_service

router = APIRouter()

@router.post("/", response_model=TransportRead)
def create_transport(
    transport_in: TransportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.supervisor))
):
    return transport_service.create_transport(db, transport_in=transport_in)

@router.patch("/{transport_id}/arrival", response_model=TransportRead)
def record_arrival(
    transport_id: str,
    update_in: TransportArrivalUpdate,
    db: Session = Depends(get_db),
    # Arriving at plant -> Admin or operator records this generally
    current_user: User = Depends(require_role(UserRole.admin, UserRole.operator))
):
    return transport_service.record_arrival(db, transport_id=transport_id, update_in=update_in)

@router.get("/{transport_id}", response_model=TransportRead)
def get_transport(
    transport_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.supervisor, UserRole.operator))
):
    return transport_service.get_transport(db, transport_id=transport_id)
