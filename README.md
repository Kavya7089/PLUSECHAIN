# 🏥 PLUSECHAIN (PulseChain) — Agentic Supply Chain Resilience Dashboard

> **Enterprise SAP RFC Integration & Autonomous Supply Chain Resilience Engine**  
> Built for healthcare logistics, hospital network monitoring, and real-time inventory risk sensing.

---

## 🌟 Executive Overview

**PulseChain** is an enterprise resilience dashboard designed to mitigate healthcare supply chain shocks and stock disruptions across hospital networks. 

It connects directly to **SAP S/4HANA / ECC** systems via **`node-rfc`** (the official SAP NetWeaver RFC SDK client for Node.js) to retrieve live inventory levels from custom Function Module **`Z_PULSE_GET_STOCK`** into table **`ET_STOCK`**.

When running in environments where SAP RFC C++ binaries are not present (such as developer workstations, lightweight containers, or CI/CD pipelines), the backend's **Resilient Fallback Mode** catches module load errors and seamlessly serves baseline hospital inventory datasets, ensuring zero developer downtime.

The React frontend continuously senses **structural disruption risks** using the Days of Cover metric:
$$\text{daysCover} = \left\lfloor \frac{\text{STOCK\_QTY}}{\text{DAILY\_USE}} \right\rfloor$$

When $\text{daysCover} < 5$, the row triggers a high-visibility structural disruption alert, enabling healthcare logistics managers to trigger the **Agentic Reallocation Engine**, which matches distressed facilities with surplus donors ($\text{daysCover} > 10$) and executes balanced inventory transfers.

---

## 🚀 Key Features

### 1. SAP NetWeaver RFC Backend (`server.js`)
- **Native SAP Connector**: Configured with `node-rfc` client using `.env` parameters (`SAP_HOST`, `SAP_SYSNR`, `SAP_CLIENT`, `SAP_USER`, `SAP_PASS`).
- **Function Module Execution**: Invokes `Z_PULSE_GET_STOCK` and returns table `ET_STOCK` under the JSON key `data`.
- **Guaranteed Resource Cleanup**: SAP RFC connection is always closed inside a `finally` block (`client.close()`).
- **Fault-Tolerant Fallback Mode**: Catches missing C++ binary errors or network connection failures and serves structured sample records.
- **Agentic Reallocation API**: `POST /api/reallocate` to execute transfers, update stock, and write to an immutable audit trail.
- **Baseline Reset & Diagnostics**: `POST /api/reset` and `GET /api/status`.

### 2. High-Tech Enterprise Frontend (React + Tailwind CSS)
- **Dark-Themed Command Center**: Professional UI with glassmorphism, glowing status beacons, and responsive layouts.
- **Top KPI Cards**:
  1. *Total Hospitals Monitored* (distinct count of hospitals in the network).
  2. *Total Inventory Volume* (aggregate unit sum across all lines).
  3. *Critical Shortages* (active count of lines where $\text{daysCover} < 5$).
  4. *Autonomous Balancer* (surplus donors ready for transfer).
- **Conditional Formatting & Risk Sensing**:
  - **Red / Hazard Highlight**: Highlighted rows with pulsing warning badges for $\text{daysCover} < 5$.
  - **Yellow / Buffer Monitoring**: $5 \le \text{daysCover} < 10$.
  - **Emerald / Surplus Ready**: $\text{daysCover} \ge 10$.
- **Agentic Reallocation Modal**:
  - Autonomous donor hospital discovery holding matching `MATERIAL_ID` with surplus stock ($> 10$ days cover).
  - Dynamic transfer quantity calculator with live before/after impact projections for both hospitals.
  - One-click execution and audit ledger.
- **Facility Network Map**: Quick-glance network visualization across all hospital sites.
- **SAP RFC Technical Console**: Displays runtime configuration, connection host, and module parameters.

---

## 📦 Architecture & Data Schema

### SAP RFC Output Schema (`ET_STOCK`)
Each line item returned under `data` adheres strictly to:
```json
{
  "HOSPITAL_ID": "H001",
  "MATERIAL_ID": "INS001",
  "STOCK_QTY": 600,
  "DAILY_USE": 100,
  "UNIT": "EA"
}
```

### Hospital Facilities & Essential Medicines Catalog
| Hospital ID | Facility Name | Region | Classification |
|---|---|---|---|
| `H001` | Metro Health Central | North Sector | Level 1 Trauma Center |
| `H002` | St. Luke's Memorial | East District | Community Care |
| `H003` | Mercy General Medical | South Hub | Tertiary Referral |
| `H004` | Cedars Regional Medical | West Valley | Surgical Center |
| `H005` | University Children's Hospital | Central Metro | Specialty Pediatric |

| Material ID | Therapeutic Name | Class | Standard Unit |
|---|---|---|---|
| `INS001` | Insulin Glargine | Critical / Endocrinology | `EA` |
| `AMX002` | Amoxicillin Trihydrate 500mg | Broad-Spectrum Antibiotic | `VIAL` |
| `PROP003` | Propofol IV Emulsion 10mg/mL | ICU General Anesthetic | `AMP` |
| `HEP004` | Heparin Sodium 5,000 IU/mL | Anticoagulant / Emergency | `VIAL` |
| `SAL005` | 0.9% Normal Saline 1,000 mL | Resuscitation Infusion | `BAG` |

---

## 🛠️ Installation & Setup Guide

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- *(Optional for live SAP)*: SAP NetWeaver RFC SDK 7.50+ installed and paths added to system environment.

### 1. Environment Configuration (`.env`)
```ini
PORT=5000

# SAP NetWeaver RFC Connection Parameters
SAP_HOST=sap-ecc-prod.healthnet.corp
SAP_SYSNR=00
SAP_CLIENT=100
SAP_USER=RFC_PULSECHAIN
SAP_PASS=PulseSecure#2026

# Agentic AI Resilience Settings
SIMULATION_MODE=false
FALLBACK_MODE_AUTO=true
```

### 2. Running the Application

#### Start the Backend Server:
```bash
npm start
# or
node server.js
```
*Backend runs on `http://localhost:5000`.*

#### Start the React Frontend:
```bash
npm run client
# or
cd frontend && npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🧪 Automated Test Suite

Run the end-to-end verification suite:
```bash
node test_suite.js
```

### Test Coverage (16/16 Passed):
- `GET /api/inventory` returns status 200 with `data` array.
- Exact sample record structure `{ HOSPITAL_ID: 'H001', MATERIAL_ID: 'INS001', STOCK_QTY: 600, DAILY_USE: 100, UNIT: 'EA' }`.
- Mathematical formula verification: `Math.floor(STOCK_QTY / DAILY_USE)`.
- Critical shortage detection threshold ($< 5$ days).
- Surplus donor discovery threshold ($> 10$ days).
- Autonomous reallocation dispatch (`POST /api/reallocate`).
- Audit trail persistence (`GET /api/reallocations`).
- Baseline restore (`POST /api/reset`).

---

## 🛡️ License
MIT License. Built for enterprise healthcare supply chain resilience.
