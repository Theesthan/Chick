# AGENT.md

## 1. Project Identity

* Name: PoultryFlow
* Type: Poultry Farm Management System (ERP-style)
* Scope: Farm → Processing → Sales pipeline

---

## 2. Tech Stack

Backend:

* FastAPI
* PostgreSQL
* SQLAlchemy
* Alembic

Frontend (future):

* React (Admin, Processing)
* Flutter (Supervisor)

Infra:

* AWS EC2
* S3 (future)
* Docker

---

## 3. Core Design Decisions

* Monolithic backend (modular structure)
* Role-based access control
* Offline-first supervisor app (future)
* GPS-based validation for reports
* Two-step verification for accuracy

---

## 4. Execution Model

* CRUD-driven system (not event-driven)
* Strong data validation at API level
* Business logic isolated in services

---

## 5. Feature Checklist

### Backend

* [ ] Auth (JWT)
* [ ] User management
* [ ] Farm management
* [ ] Batch tracking
* [ ] Procurement
* [ ] Inventory system
* [ ] Daily reports
* [ ] Verification flow
* [ ] Sales & weighing
* [ ] Transport tracking
* [ ] Processing module

---

## 6. Development Rules

* Follow clean architecture strictly
* No logic inside routes
* Keep services reusable
* Use environment variables
* Write readable code

---

## 7. Data Validation Rules

* Reject invalid GPS submissions
* Enforce required fields
* Prevent negative stock values
* Ensure relational integrity

---

## 8. Future Hooks

Prepare for:

* Cold storage module
* QR tracking
* OCR integration
* Vendor orders

---

## 9. Agent Instructions

When building:

1. Start with models
2. Then schemas
3. Then CRUD
4. Then services
5. Then routes

Do NOT skip order.

---

## 10. Changelog (To Maintain)

Update when:

* New feature added
* Schema changed
* API updated

Format:

2026-03-21
* Feature: Initial MVP Build Complete
* Modules affected: Users, Farms, Batches, Procurement, Inventory, DailyReports, Weighing, Transport, Processing, Sales, Auth
* Architecture: Scaffolding, Models, Schemas, CRUD, Services, Routes, Docker and Alembic Config
