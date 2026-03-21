# PoultryFlow Backend

Production-grade Poultry Farm Management System built with **FastAPI** and **PostgreSQL**.

## Architecture & Principles
This system uses a strict 5-layer architecture to ensure clean separation of concerns:
`routes` ➔ `services` ➔ `crud` ➔ `schemas` ➔ `models`

- **Role-Based Access Control (RBAC)**: Enforced via `require_role()` dependency on all routes.
- **Data Validation**: Strict validation via Pydantic on incoming payloads.
- **Business Logic Isolation**: Handled exclusively in the `services/` layer (e.g., GPS haversine distance checks, inventory sum verifications, auto-calculating net weights and losses).
- **Computed Fields**: Fields like `closing_stock` and `net_weight` are computed dynamically at save-time, rather than being managed manually.

## Core Modules
1. **Auth & Users**: JWT-based login for Admin, Supervisor, and Operator roles.
2. **Farms & Batches**: Lifecycle tracking of bird flocks at individual farm sites.
3. **Inventory & Procurement**: Ledger-based inventory (no simple mutable quantity).
4. **Daily Reporting**: Mortality and feed tracking with GPS location validation.
5. **Transport & Processing**: Dispatch/arrival, and whole-bird to chop-breakdown (wings, breast, etc.) weight validation.
6. **Sales & Analytics**: Profitability logic aggregating revenue and performance metrics.

## Getting Started

### Quickstart (Docker)
```bash
docker-compose up -d --build
```
This single command will:
1. Start PostgreSQL (15-alpine)
2. Run Alembic migrations automatically
3. Start the FastAPI API server on port `8000`

Go to `http://localhost:8000/docs` to see the full Swagger UI.

### Manual Setup
1. Create a `.env` file from `.env.example`.
2. Install dependencies: `pip install -r requirements.txt`
3. Init DB migrations: `alembic upgrade head`
4. Run server: `uvicorn main:app --reload`
