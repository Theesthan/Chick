# DESIGNDOC.md

## 1. System Overview

Architecture:

Client (Web + Mobile)
↓
FastAPI Backend
↓
PostgreSQL Database

---

## 2. Backend Architecture

Layered architecture:

* Models (DB schema)
* Schemas (validation)
* CRUD (DB ops)
* Services (business logic)
* Routes (API layer)

---

## 3. Core Entities

Users
Farms
Batches
Procurement
Inventory
DailyReports
Sales
Transport
Processing

---

## 4. Relationships

* Farm → multiple Batches
* Batch → multiple DailyReports
* Batch → one Processing record
* Procurement → Inventory

---

## 5. Business Logic

### Inventory

closing_stock = opening_stock - consumed

### Weight

net_weight = gross_weight - tare_weight

### Loss

loss = farm_weight - plant_weight

### Profit

profit = sales - (feed + medicine + transport + procurement)

---

## 6. API Design

Auth:
POST /auth/login

Farms:
GET /farms
POST /farms

Reports:
POST /reports
PATCH /reports/{id}/verify

Inventory:
POST /inventory/add
POST /inventory/issue

Processing:
POST /processing/inward
POST /processing/output

---

## 7. Security

* JWT authentication
* Role-based authorization
* Input validation
* Password hashing

---

## 8. Deployment

* Dockerized backend
* PostgreSQL container
* Hosted on AWS EC2

---

## 9. Data Storage

* PostgreSQL → structured data
* S3 → images (future OCR)

---

## 10. Scalability Plan

Phase 1:

* Single EC2 instance

Phase 2:

* Move DB to RDS

Phase 3:

* Add caching and scaling

---

## 11. Logging & Monitoring

* Basic logging for all APIs
* Error tracking
* Future: monitoring tools

---

## 12. UI Philosophy

* Simple dashboards
* Minimal input
* Fast workflows
* Field-friendly design

