import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
)

logging.basicConfig(level=logging.INFO)

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


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "PoultryFlow API"}
