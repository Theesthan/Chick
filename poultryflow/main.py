import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError

from database import SessionLocal
from crud.user import user as user_crud
from schemas.user import UserCreate
from models.user import UserRole

from routes import (
    auth,
    users,
    farms,
    batches,
    procurement,
    inventory,
    daily_reports,
    weighing,
    transport,
    processing,
    sales,
    reports,
    logs,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_default_users() -> None:
    """Create default local-dev accounts if they do not exist yet."""
    default_users = [
        UserCreate(name="Admin User", email="admin@poultryflow.com", password="admin123", role=UserRole.admin),
        UserCreate(name="Supervisor User", email="supervisor@poultryflow.com", password="super123", role=UserRole.supervisor),
        UserCreate(name="Operator User", email="operator@poultryflow.com", password="oper123", role=UserRole.operator),
    ]

    db = SessionLocal()
    try:
        for default_user in default_users:
            existing = user_crud.get_by_email(db, email=default_user.email)
            if existing:
                continue
            user_crud.create(db, obj_in=default_user)
            logger.info("Seeded default user: %s", default_user.email)
    except SQLAlchemyError:
        logger.exception("Failed while seeding default users")
    finally:
        db.close()

app = FastAPI(
    title="PoultryFlow API",
    description="Poultry Farm Management System — Farm to Processing Pipeline",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(farms.router, prefix="/farms", tags=["Farms"])
app.include_router(batches.router, prefix="/batches", tags=["Batches"])
app.include_router(procurement.router, prefix="/procurement", tags=["Procurement"])
app.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
app.include_router(daily_reports.router, prefix="/daily-reports", tags=["Daily Reports"])
app.include_router(weighing.router, prefix="/weighing", tags=["Weighing"])
app.include_router(transport.router, prefix="/transport", tags=["Transport"])
app.include_router(processing.router, prefix="/processing", tags=["Processing"])
app.include_router(sales.router, prefix="/sales", tags=["Sales"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(logs.router, prefix="/logs", tags=["Logs"])


@app.on_event("startup")
def startup_seed_users() -> None:
    seed_default_users()


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "PoultryFlow API"}
