# PRD.md

## 1. Overview

PoultryFlow is a **farm-to-processing poultry management system** designed to track and optimize the full lifecycle of poultry operations:

Procurement → Farming → Monitoring → Harvest → Transport → Processing → Sales

The system is built as a **modular ERP-like platform** focused on:

* Data accuracy
* Fraud prevention
* Operational visibility
* Profit tracking

Primary deployment: single-company MVP, with architecture ready for multi-tenant SaaS expansion.

---

## 2. Goals & Non-Goals

### Goals

* Centralize farm, feed, and medicine tracking
* Enable real-time supervisor reporting with validation
* Track bird lifecycle from farm to processing plant
* Provide actionable analytics (mortality, feed efficiency, profit)
* Ensure fraud-resistant data collection (GPS + verification)

### Non-Goals (MVP)

* No full logistics optimization system
* No IoT sensor integration
* No vendor marketplace
* No advanced AI predictions (only hooks)

---

## 3. Personas & Use Cases

### Persona 1: Admin (Owner / HQ)

* Manages farms, inventory, and users
* Monitors performance and profitability
* Needs dashboards and reports

---

### Persona 2: Supervisor (Field Worker)

* Visits farms daily
* Records mortality and feed consumption
* Handles weighing during harvest

Constraints:

* Low-tech environment
* Needs fast, simple UI

---

### Persona 3: Processing Operator

* Receives birds at plant
* Records weight and breakdown
* Updates stock

---

## 4. Core User Flows

### 4.1 Farm Setup

* Admin creates farm with:

  * Site ID
  * Farmer details
  * Capacity
* Admin creates batch:

  * Chick count
  * Start date

---

### 4.2 Procurement & Inventory

* Admin records purchase of:

  * Feed
  * Medicine
  * Chicks

* Inventory updates automatically

* Distribution to farms tracked

---

### 4.3 Daily Monitoring (Supervisor)

1. Supervisor selects assigned farm
2. System validates:

   * GPS within 200m OR QR scan
3. Supervisor enters:

   * Mortality count
   * Feed consumption
4. Data is submitted

---

### 4.4 Verification Flow

* Supervisor submits report
* Admin verifies
* Only verified data used in analytics

---

### 4.5 Harvest & Weighing

* Supervisor records:

  * Gross weight
  * Tare weight
* Net weight auto-calculated

Optional:

* Upload image of weighing scale (future OCR)

---

### 4.6 Transport

* Record:

  * Vehicle number
  * Dispatch time
  * Arrival time

---

### 4.7 Processing Plant

* Record inward weight

* Compare farm vs plant weight

* Calculate loss

* Enter breakdown:

  * Wings
  * Legs
  * Breast
  * Lollipop
  * Waste

---

### 4.8 Sales & Profit

* Record sales data
* Compute:

Profit = Sales - (Feed + Medicine + Transport + Procurement)

---

## 5. Reports & Analytics

* Mortality trends
* Feed efficiency
* Batch performance
* Weight loss
* Profit per batch

---

## 6. Data Integrity & Validation

* GPS validation for supervisor entries
* Two-step verification (Supervisor → Admin)
* Audit logs for critical operations

---

## 7. Future Features

* Cold storage tracking
* QR-based packaging
* Vendor order system
* AI OCR for weighing
* IoT-based monitoring

---

## 8. UI/UX Guidelines

* Minimal and functional
* Fast data entry (mobile-first for supervisors)
* No complex animations
* Clear forms and dashboards

