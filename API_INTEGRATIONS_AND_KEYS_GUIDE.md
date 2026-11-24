# PulseChain v3.1 — API Integrations & Configuration Guide

This document provides a comprehensive architecture reference for all external and enterprise APIs integrated into **PulseChain v3.1**, specifying:
1. Which APIs are used and why.
2. Which APIs require API keys vs. **Zero-Key Free Public APIs**.
3. Step-by-step instructions on obtaining credentials.
4. Environment variable configuration for both `backend/.env` and `frontend/.env`.

---

## 1. Architecture Overview & Single Source of Truth (SSOT)

```
                            ┌──────────────────────────────────────────────┐
                            │            PulseChain React Client           │
                            │      (Leaflet + Tailwind + Supabase JS)      │
                            └──────────────────────┬───────────────────────┘
                                                   │ Authorization: Bearer <Supabase JWT>
                                                   ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             PulseChain Node.js Gateway                           │
│                            (Port 5000 / Express Server)                          │
└──────────────┬───────────────────┬───────────────────┬─────────────────┬─────────┘
               │                   │                   │                 │
               ▼                   ▼                   ▼                 ▼
   ┌───────────────────────┐ ┌───────────┐      ┌───────────────┐ ┌─────────────┐
   │     SAP S/4HANA       │ │ Supabase  │      │  Zero-Key     │ │ Google AI   │
   │   OData v2 Gateway    │ │ Auth & DB │      │  Public APIs  │ │ Gemini      │
   │     (ZPLUSE_SRV)      │ │(Postgres) │      │(OSRM, Meteo,  │ │(GenAI Risk) │
   │                       │ │           │      │    GDELT)     │ │             │
   └───────────────────────┘ └───────────┘      └───────────────┘ └─────────────┘
```

- **SAP S/4HANA (Strict ERP SSOT)**: Authoritative source for all stock inventory (`ZPULSE_INV` / `InventorySet`), supplier fleet (`ZPULSE_SUPP` / `SupplierSet`), and native HANA calculation of **TrustScore, SupplierTier, and 8 Performance Factors**.
- **Supabase (Tenant Identity & Non-ERP Auditing)**: Multi-tenant user authentication (RBAC for `HOSPITAL_MANAGER`, `SHOPKEEPER`, `SUPPLIER`, `REGIONAL_ADMIN`), password hashing, and lightweight logging for stock audits and hospital-to-hospital transfers.
- **Zero-Key Public Services**: Road navigation, weather, and world event sensing that run with zero cost and no subscription barriers.
- **Google Gemini**: GenAI supply-chain risk scoring and disruption simulation.

---

## 2. Master API Matrix

| # | API Name | Category | Auth Method | Requires API Key? | Fallback Guaranteed? |
|---|----------|----------|-------------|-------------------|----------------------|
| **1** | **SAP S/4HANA Gateway OData v2** | Enterprise ERP SSOT | HTTP Basic + Dynamic CSRF | **Yes** (Username + Password) | Yes (Local Emergency JSON Cache) |
| **2** | **Supabase Auth & Database** | Identity & PostgreSQL | Bearer JWT / Anon Key | **Yes** (Project URL + Anon Key) | Yes (Dual-Token Bypass for offline/dev) |
| **3** | **OSRM Road Routing** | Geospatial / Road Transit | Free HTTP REST | **NO (Zero-Key)** | Yes (Haversine coordinate calculation) |
| **4** | **Open-Meteo Weather** | Meteorological Sensing | Free HTTP REST | **NO (Zero-Key)** | Yes (Seasonal regional weather defaults) |
| **5** | **GDELT Project DOC 2.0** | Real-Time News & Events | Free HTTP REST | **NO (Zero-Key)** | Yes (Synthesized geopolitical feed) |
| **6** | **Google Gemini GenAI** | Generative AI Risk Engine | API Key (`x-goog-api-key`) | **Yes** (Google AI Key) | Yes (Automated Deterministic Sensor) |

---

## 3. Detailed API Guides & Key Acquisition

### 1. SAP S/4HANA Gateway OData v2 (`ZPLUSE_SRV`)
- **Service Endpoint**: `https://merida.cob.csuchico.edu:8038/sap/opu/odata/sap/ZPLUSE_SRV`
- **Purpose**:
  - `GET /InventorySet?sap-client=105`: Real-time hospital stock levels and daily burn rates.
  - `GET /SupplierSet?sap-client=105`: Supplier fleet profiles, base capacity, contracted unit costs, and native SAP HANA calculations (`TRUST_SCORE`, `SUPPLIER_TIER`, `IS_ELIGIBLE`).
  - `PUT /InventorySet(HospitalId='...',MaterialId='...')`: Direct stock adjustments with CSRF token verification.
  - `POST /SupplierSet`: Bids and vendor proposals with auditable delay reasons.
- **How to Get Access**:
  - Provided by your enterprise SAP S/4HANA system administrator or university lab coordinator.
  - Required parameters: Hostname, Port, SAP Client (`105`), Username, and Password.
- **Environment Variables** (`.env`):
  ```env
  SAP_ODATA_URL=https://merida.cob.csuchico.edu:8038/sap/opu/odata/sap/ZPLUSE_SRV
  SAP_CLIENT=105
  SAP_USER=YOUR_SAP_USERNAME
  SAP_PASSWD=YOUR_SAP_PASSWORD
  SAP_ALLOW_SELF_SIGNED=true
  ```

---

### 2. Supabase Auth & PostgreSQL
- **Service Endpoint**: `https://<PROJECT-REF>.supabase.co`
- **Purpose**:
  - Multi-tenant authentication: JSON Web Tokens (JWT) mapped to role-based tenant profiles in `public.user_profiles`.
  - Non-ERP audit tables: `public.stock_audits` and `public.reallocation_logs`.
- **How to Get Keys**:
  1. Navigate to [https://supabase.com](https://supabase.com) and create an account or log in.
  2. Click **New Project** and choose a name (e.g., `pulsechain-prod`).
  3. Once provisioned, go to **Project Settings** (gear icon) -> **API**.
  4. Copy:
     - **Project URL** (e.g., `https://zczftbiaerctvbbrgbgx.supabase.co`)
     - **Project API Keys** -> `anon` / `public` key (Publishable, used by frontend).
     - **Project API Keys** -> `service_role` key (Secret, used by backend).
  5. Go to the **SQL Editor** in your Supabase dashboard and run the idempotent migration file:
     `supabase/schema.sql` (included in this repository).
  6. (Optional) Run the user seeder to create the 8 standard demo personas:
     ```bash
     node backend/scripts/seed_supabase_users.js
     ```
- **Environment Variables**:
  - **Backend (`.env`)**:
    ```env
    SUPABASE_URL=https://zczftbiaerctvbbrgbgx.supabase.co
    SUPABASE_ANON_KEY=sb_publishable_ih9gn6wrgMRUJZXUHYn2zw_Gjo_tjw9
    SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
    ```
  - **Frontend (`frontend/.env`)**:
    ```env
    VITE_SUPABASE_URL=https://zczftbiaerctvbbrgbgx.supabase.co
    VITE_SUPABASE_ANON_KEY=sb_publishable_ih9gn6wrgMRUJZXUHYn2zw_Gjo_tjw9
    ```

---

### 3. OSRM (Open Source Routing Machine) API
- **Service Endpoint**: `https://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}`
- **Purpose**:
  - Calculates true road driving routes between supplier distribution hubs and hospitals.
  - Returns road distance in kilometers, driving duration in hours, and high-resolution GeoJSON polylines for rendering on Leaflet maps.
  - Implements the **+1 Day Transit Rule**:
    $$\text{Max Allowed Lead Days} = \lceil \frac{\text{Duration Hours}}{24} \rceil + 1$$
- **Requires API Key?**: **NO (Zero-Key)**.
  - OSRM is a completely public, open-source routing API that does not require an API key, credit card, or registration.
- **Backend Service**: Handled automatically in `backend/services/osrmRoutingService.js`.

---

### 4. Open-Meteo Weather API
- **Service Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Purpose**:
  - Fetches real-time temperature (°C), relative humidity (%), precipitation rate (mm/h), wind speed (km/h), and WMO severe weather codes for hospital and supplier coordinates (Bhopal, Indore, Jabalpur).
  - Supplies meteorological telemetry to the Gemini GenAI Disruption Sensor.
- **Requires API Key?**: **NO (Zero-Key)**.
  - Open-Meteo is free for open-source and non-commercial usage with zero API key required.
- **Backend Service**: Handled automatically in `backend/services/externalSensingService.js`.

---

### 5. GDELT Project DOC 2.0 API
- **Service Endpoint**: `https://api.gdeltproject.org/api/v2/doc/doc`
- **Purpose**:
  - Monitors global news broadcasts, port disruptions, highway blockades, and transit delays in real time.
  - Queries supply chain, pharmaceutical, and logistics unrest keywords.
- **Requires API Key?**: **NO (Zero-Key)**.
  - GDELT is supported by Google Cloud and is completely free and unauthenticated for public research and analytics queries.
- **Backend Service**: Handled automatically in `backend/services/externalSensingService.js`.

---

### 6. Google Gemini GenAI API
- **Service Endpoint**: Google Generative AI SDK (`@google/genai` or `@google/generative-ai`)
- **Purpose**:
  - Synthesizes multi-source inputs (Open-Meteo weather + GDELT news + OSRM transit delays) into an automated Disruption Impact Verdict:
    - `ON_TIME`
    - `DELAYED`
    - `CANCELLATION_RISK`
  - Powers the 4-Stage GenAI Disruption & Scenario Simulator in Screen 2 and Screen 5.
- **How to Get Key**:
  1. Visit [Google AI Studio](https://aistudio.google.com/).
  2. Sign in with your Google account.
  3. Click **Get API Key** -> **Create API Key in new project**.
  4. Copy the generated key string.
- **Deterministic Fallback**: If `GEMINI_API_KEY` is omitted, invalid, or reaches quota limits, PulseChain automatically activates its built-in rule engine without crashing or interrupting operations.
- **Environment Variable** (`.env`):
  ```env
  GEMINI_API_KEY=AIzaSy...
  ```

---

## 4. Complete Environment Variables Configuration Reference

### Backend `.env` (`e:/PULSECHAIN/.env`)
```env
# Server Port
PORT=5000

# SAP S/4HANA Gateway OData v2 Configuration (SSOT)
SAP_ODATA_URL=https://merida.cob.csuchico.edu:8038/sap/opu/odata/sap/ZPLUSE_SRV
SAP_CLIENT=105
SAP_USER=YOUR_SAP_USER
SAP_PASSWD=YOUR_SAP_PASSWORD
SAP_ALLOW_SELF_SIGNED=true

# Supabase Auth & Multi-Tenant PostgreSQL
SUPABASE_URL=https://zczftbiaerctvbbrgbgx.supabase.co
SUPABASE_ANON_KEY=sb_publishable_ih9gn6wrgMRUJZXUHYn2zw_Gjo_tjw9
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# Google Gemini GenAI Key (Optional: has deterministic fallback)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# Public APIs (OSRM, Open-Meteo, GDELT)
# No keys required! Ready out-of-the-box.
```

### Frontend `.env` (`e:/PULSECHAIN/frontend/.env`)
```env
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:5000

# Supabase Client Configuration (Safe for client-side bundle)
VITE_SUPABASE_URL=https://zczftbiaerctvbbrgbgx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_ih9gn6wrgMRUJZXUHYn2zw_Gjo_tjw9
```

---

## 5. Verification Commands

To verify that all services, authentication, and frontend modules build and function cleanly:

```powershell
# 1. Run Enterprise Suite (Validates SAP OData, Supabase JWT verification, OSRM road rules)
node backend/tests/test_enterprise_suite.js

# 2. Run Comprehensive System Check (21/21 assertions)
node pulsechain_system_check.js --readonly

# 3. Test Production Frontend Build (Vite + React)
npm --prefix frontend run build
```
