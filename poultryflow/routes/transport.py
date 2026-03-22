from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserRole
from schemas.transport import TransportCreate, TransportArrivalUpdate, TransportRead
from core.deps import require_role
from services import transport as transport_service
from services import activity_log as al

router = APIRouter()


@router.get("/", response_model=list[TransportRead])
def list_transports(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.supervisor, UserRole.operator))
):
    return transport_service.list_transports(db, skip=skip, limit=limit)


@router.post("/", response_model=TransportRead)
def create_transport(
    transport_in: TransportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.supervisor))
):
    result = transport_service.create_transport(db, transport_in=transport_in)
    al.log(db, action="create_transport", user_id=current_user.id, entity="transport",
           entity_id=result.id,
           detail=f"Batch {transport_in.batch_id[:8]} vehicle={transport_in.vehicle_number} → {transport_in.destination}")
    return result


@router.patch("/{transport_id}/arrival", response_model=TransportRead)
def record_arrival(
    transport_id: str,
    update_in: TransportArrivalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.supervisor, UserRole.operator))
):
    result = transport_service.record_arrival(db, transport_id=transport_id, update_in=update_in)
    al.log(db, action="record_arrival", user_id=current_user.id, entity="transport",
           entity_id=transport_id, detail=f"Arrived at {update_in.arrival_time}")
    return result


@router.get("/{transport_id}", response_model=TransportRead)
def get_transport(
    transport_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.supervisor, UserRole.operator))
):
    return transport_service.get_transport(db, transport_id=transport_id)
