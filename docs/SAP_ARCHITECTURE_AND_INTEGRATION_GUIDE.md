# PulseChain — End-to-End SAP Enterprise Architecture & Integration Guide

**Hackfest 2026 | Group Number:** `418`  
**Live Production Application:** [https://plusechain.onrender.com/](https://plusechain.onrender.com/)  
**Sandbox Validity:** Active through December 8, 2026  
**Primary Design System:** 60-30-10 Rule (60% Abyss Teal `#081F20`, 30% Sand Putty `#DDD3C2`, 10% Taxi Volt `#FFD400`)

---

## 1. Executive Summary

**PulseChain** is an enterprise-grade healthcare cold-chain supply chain resilience control tower engineered for hospital networks across Madhya Pradesh (**Bhopal, Indore, Jabalpur**). Rather than treating SAP as a passive data store, PulseChain orchestrates **four distinct SAP enterprise layers** alongside real-world geospatial road routing, meteorological telemetry, and geopolitical event streams:

1. **Enterprise Portal Layer — SAP Build Work Zone (Business Site):** Provides unified Fiori launchpad access (`PulseChain Enterprise Hub`) launching the live `PulseChain Control Tower` application.
2. **Operational ERP Core — Live SAP S/4HANA Gateway (`ZPLUSE_SRV`):** Operates as the authoritative System of Record over HTTPS OData v2 (`Client 105`), performing real-time transactional reads and writes across `ZPULSE_INV`, `ZPULSE_SUPP`, and `ZPULSE_USERS`. Native SAP HANA SQL pushdown computes 8-factor supplier trust scores and tiering (`PLATINUM`, `GOLD`, `SILVER`, `BLOCKED`).
3. **Executive Analytics Warehouse — Live SAP HANA Cloud (`Hackfest0418`):** Stores time-series regional risk snapshots (`PULSECHAIN_RISK_SNAPSHOTS`), supplier SLA delay tracking ledgers (`PULSECHAIN_SUPPLIER_SLA`), and native SQL aggregation views (`V_REGIONAL_EXEC_SUMMARY`) over TLS (`Port 443`).
4. **Governed Business AI — SAP AI Launchpad & Generative AI Hub (`0418_PulseChain_Orchestration`):** Enforces enterprise AI governance in resource group `Learning-AIG` using **SAP Data Privacy Integration (DPI) Masking** (`profile-person`, `profile-email`, `profile-phone`) and **Azure Content Safety Filtering** (`Hate`, `SelfHarm`, `Sexual`, `Violence`), fully mirrored in the live Node.js runtime.

---

## 2. System-Wide Architecture

```
+-----------------------------------------------------------------------------------+
|                        SAP BUILD WORK ZONE (Business Site)                        |
|            Enterprise Launchpad Tile: "PulseChain Control Tower"                  |
+-----------------------------------------+-----------------------------------------+
                                          | Launches in New Tab (HTTPS)
                                          v
+-----------------------------------------------------------------------------------+
|                   PULSECHAIN UNIFIED WEB APPLICATION (Render)                     |
|                     https://plusechain.onrender.com/                              |
|  +-------------------------------------+---------------------------------------+  |
|  |   React 19 + Tailwind Control UI    |     Node.js / Express API Gateway     |  |
|  |  - 4 Role-Based Personas (1-Click)  |  - Multi-Tenant RBAC & JWT Guard      |  |
|  |  - Leaflet + OSM Route Map (No Key) |  - SAP OData v2 + CSRF Token Client   |  |
|  |  - SAP HANA Executive Bento Card    |  - HANA Cloud TLS Client (`hdb`)      |  |
|  |  - 60-30-10 Abyss/Sand/Volt System  |  - Governed AI Orchestration Engine   |  |
|  +-------------------------------------+---------------------------------------+  |
+----+--------------------+--------------------+--------------------+---------------+
     |                    |                    |                    |
     | HTTPS OData v2     | TLS SQL (Port 443) | Governed Prompt    | Live Telemetry
     | (CSRF + Basic)     | (`hdb` Driver)     | + DPI Masking      | (Zero-Key APIs)
     v                    v                    v                    v
+-------------------+ +-------------------+ +-------------------+ +-----------------+
|   SAP S/4HANA     | |  SAP HANA CLOUD   | | SAP AI LAUNCHPAD  | | EXTERNAL FEEDS  |
|   (`ZPLUSE_SRV`)  | |  (`Hackfest0418`) | | (`Learning-AIG`)  | |                 |
|                   | |                   | |                   | | - Open-Meteo    |
| - ZPULSE_INV      | | - PULSECHAIN_RISK | | - 0418_PulseChain | |   (Weather radar|
| - ZPULSE_SUPP     | |   _SNAPSHOTS      | |   _Orchestration  | | - GDELT Project |
| - ZPULSE_USERS    | | - PULSECHAIN_     | | - DPI PII Masking | |   (Geopolitics) |
| - Native HANA     | |   SUPPLIER_SLA    | | - Azure Content   | | - OSRM Routing  |
|   Trust Score SQL | | - V_REGIONAL_     | |   Safety Filter   | |   (Road ETA +1d)|
|   Pushdown        | |   EXEC_SUMMARY    | | - Gemini 2.5 Lite | | - Supabase Auth |
+-------------------+ +-------------------+ +-------------------+ +-----------------+
```

---

## 3. Deep Dive into the 4 SAP Enterprise Layers

### Layer 1: SAP Build Work Zone (Enterprise Fiori Launchpad)
* **Access Source:** Hackfest 2026 SAP Learning Hub Sandbox (`Access -> SAP Build Work Zone`).
* **Configuration:**
  * **Application:** Registered *PulseChain Control Tower* under *Content Manager -> My Content -> Apps*.
  * **UI Technology:** URL-based Fiori Tile targeting `https://plusechain.onrender.com/`.
  * **Semantic Intent:** `Semantic Object: PulseChain`, `Action: display`.
  * **Assignment:** Assigned to `Everyone` role, mapped to the `Healthcare Supply Chain` catalog group, and published to the site.
* **Operational Value:** Supply chain executives and hospital directors access PulseChain directly from their corporate SAP launchpad without needing separate bookmarks or unverified links.

---

### Layer 2: SAP S/4HANA Gateway (`ZPLUSE_SRV`) — Operational System of Record
* **Gateway Endpoint:** `https://merida.cob.csuchico.edu:8038/sap/opu/odata/sap/ZPLUSE_SRV?sap-client=105`
* **Protocol & Security:** HTTPS OData v2 with HTTP Basic Authentication and dynamic `x-csrf-token` handling for state-changing calls.
* **Connected Entities:**
  1. **`ZPULSE_INV` (`InventorySet` — 37 live records):** Real-time hospital inventory tracking across facilities `H001` to `H005` in Bhopal, Indore, and Jabalpur. Tracks `STOCK_QTY`, `DAILY_USE`, and calculated `DAYS_COVER`.
  2. **`ZPULSE_SUPP` (`SupplierSet` — 11 live records):** Supplier master records including contracted material rates, promised lead times, cold-chain compliance status (`COMPLIANCE = 'Y' | 'N'`), delay justifications (`DELAY_REASON`), and **native SAP HANA SQL-calculated Trust Scores** (`TRUST_SCORE`) and tiering (`SUPPLIER_TIER`).
  3. **`ZPULSE_USERS` (`UserSet`):** Tenant authorization and role scoping mapping to SAP personnel numbers.
* **Non-Negotiable Architecture Rules:**
  * **Zero React Math:** Trust scores, tiering, and supplier rankings are calculated natively in SAP HANA SQL pushdown inside S/4HANA—never mocked or calculated client-side in React.
  * **2-Step Verification Officer Approval Gate:** AI reallocation recommendations **never** write directly to ERP stock. Stock updates happen strictly via a 2-step physical count verification:
    - **Step 1 (Dispatch Approval):** Sending hospital Cold-Chain & Stock Verification Officer performs physical stock count and confirms departure -> Deducts inventory from sending hospital in `ZPULSE_INV`.
    - **Step 2 (Goods Receipt Approval):** Receiving hospital Cold-Chain & Stock Verification Officer confirms physical arrival and cold-chain integrity -> Increments inventory at receiving hospital in `ZPULSE_INV`.

---

### Layer 3: SAP HANA Cloud (`Hackfest0418`) — Executive Analytics Warehouse
* **Host & Port:** `64e8c26b-3e07-47e9-b246-617058b0306e.hna3.prod-eu10.hanacloud.ondemand.com:443`
* **Driver:** Pure JavaScript `hdb` client with TLS enabled (`useTLS: true`).
* **Database Schema / User:** `Hackfest0418`
* **Warehouse Schema Objects:**
  1. **`PULSECHAIN_RISK_SNAPSHOTS` (Column Table):**
     Logs point-in-time state of hospital stock, ambient temperature (via Open-Meteo), geopolitical threat flags (GDELT), days of cover, and disruption impact status.
  2. **`PULSECHAIN_SUPPLIER_SLA` (Column Table):**
     Tracks historical vendor fulfillment, comparing promised lead days vs. actual OSRM road transit days, flagging delays and SLA breaches.
  3. **`V_REGIONAL_EXEC_SUMMARY` (Aggregated SQL View):**
     Pre-aggregates total regional facilities, critical shortages (`DAYS_COVER < 5`), average cover across corridors, and vendor compliance rates directly in HANA Cloud memory.
* **Sync & Resilience:**
  - Automated non-blocking insertion hook during AI disruption analysis.
  - On-demand synchronization via `POST /api/analytics/hana-cloud/sync` directly from the Regional Head dashboard.
  - Complete error boundary isolation: If the HANA Cloud sandbox is in standby or paused, the application degrades gracefully using cached telemetry without interrupting S/4HANA operations.

---

### Layer 4: SAP AI Launchpad & Generative AI Hub (`0418_PulseChain_Orchestration`)
* **Environment:** SAP AI Core `shared-practice-ai-core` | Resource Group: `Learning-AIG`
* **Pipeline Name & Version:** `0418_PulseChain_Orchestration` (`v1.0.0`)
* **Underlying Model:** `gemini-2.5-flash-lite` (Temperature: `0.20`, Output Tokens: `2048`)
* **Governance Guardrails:**
  1. **SAP Data Privacy Integration (DPI):**
     Redacts personal information before prompt transmission:
     - `profile-person` -> `MASKED_PERSON`
     - `profile-email` -> `MASKED_EMAIL`
     - `profile-phone` -> `MASKED_PHONE`
  2. **Azure Content Safety Filtering:**
     Strict safety filter across `Hate`, `SelfHarm`, `Sexual`, and `Violence` (threshold: `2`).
  3. **Hardened Resilience Prompt Specification:**
     Enforces strict JSON schema output, forbids recommending blocked suppliers (`IsEligible = N`), checks promised lead times against OSRM road transit times (`LeadTime <= OsrmTravelDays + 1`), and enforces the 2-step physical verification note in clinical summaries.
* **Production SDK & Dual-Execution Engine (`backend/sapGenAiService.js`):**
  - **Primary Route:** Uses `@sap-ai-sdk/orchestration` (`OrchestrationClient`) when `AICORE_SERVICE_KEY` is present.
  - **Safe Fallback Route:** Applies local regex PII masking (`maskLocalPii`), formats the exact governed prompt from `sap-orchestration-config.json`, and invokes Google GenAI with deterministic offline fallback so the Render deployment never crashes.

---

## 4. Multi-Tenant Role-Based Access Control (RBAC)

Pre-seeded credentials allow 1-click evaluation from the login screen:

| Role Key | Persona / User | Email | Access Scope |
| :--- | :--- | :--- | :--- |
| **`admin`** | **Team Techy's** (Regional Admin) | `regional.head@pulsechain.org` | Full corridor visibility across all MP facilities (`ALL`), SAP HANA Cloud analytics, master vendor ledger, systemic disruption runner. |
| **`manager`** | **Dr. Kavya** (H004 Hospital Manager) | `kavyarajoria9691@gmail.com` | Scoped to Bhopal Apex Care (`H004`). Authorizes peer transfers, audits cold chain, submits post-delivery vendor reviews. |
| **`verification_officer`** | **Sejal Tiwari** (H004 Verification Officer) | `tiwarisejal80@gmail.com` | Scoped to Cold-Chain Bay 1 (`H004`). Submits physical stock counts, verifies goods receipts, confirms outbound dispatches. |
| **`supplier`** | **Saumay Dubey** (V1001 Platinum Vendor) | `soumaydubey073@gmail.com` | Supplier portal for BioPharm Global Logistics (`V1001`). Submits competitive quotes, bids on open hospital RFQs. |

*Default password for all demo personas:* `Pulse@2026` (or `pass123`).

---

## 5. Live Telemetry & Open-Source Integration

1. **OSRM (Open Source Routing Machine):**
   Queries live road geometry, driving distances, and travel times between supplier distribution depots and hospital bays. Enforces the **Travel Time + 1 Day** cold-chain delivery validation rule.
2. **OpenStreetMap Leaflet Integration (Zero Watermarks):**
   Uses official OpenStreetMap standard tiles (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`). In dark mode, tiles are inverted into an Abyss Teal palette using custom CSS filters; in light mode, tiles render crisp natural terrain without any Carto API key watermarks.
3. **Open-Meteo Live Meteorological Feed:**
   Real-time temperature, precipitation, and wind speeds around target hospital nodes. Triggers automated cold-chain risk elevation if transit temperatures exceed 8°C.
4. **GDELT Global News Event Stream:**
   Scans geopolitical and freight disruption news (e.g., highway closures, protests, strikes) to calculate systemic regional risk scores.

---

## 6. Real-Time End-to-End Operational Lifecycle

```
[1. SENSING]
Open-Meteo detects 38°C heatwave + GDELT flags NH-46 logistics disruption.
S/4HANA reports Hospital H004 Insulin (INS001) stock at 150 EA (3.0 days cover).
                     │
                     ▼
[2. GOVERNED AI EVALUATION]
0418_PulseChain_Orchestration evaluates live SAP stock + OSRM travel times.
DPI masks doctor/manager PII. AI generates structured recovery plan:
• Peer transfer: 500 EA Insulin from Hub H005 (Bhopal Central Reserve - 4h travel).
• Backup purchase: BioPharm V1001 (Platinum 94.60).
• Blocked: Reliant V1003 (COMPLIANCE: N - cold-chain temperature excursion).
                     │
                     ▼
[3. HUMAN AUTHORIZATION]
H004 Hospital Manager reviews AI plan and authorizes transfer request.
Supabase creates PENDING_DISPATCH audit shipment (S/4HANA stock stays unchanged).
                     │
                     ▼
[4. VERIFICATION OFFICER DISPATCH APPROVAL]
Hub H005 Cold-Chain & Stock Verification Officer performs physical count in Cold-Chain Bay and clicks Approve Dispatch.
PulseChain calls S/4HANA OData MERGE -> Deducts 500 EA from H005 in ZPULSE_INV.
                     │
                     ▼
[5. VERIFICATION OFFICER RECEIPT APPROVAL]
H004 Cold-Chain & Stock Verification Officer receives container, inspects data logger, and clicks Approve Receipt.
PulseChain calls S/4HANA OData MERGE -> Increments 500 EA at H004 in ZPULSE_INV.
                     │
                     ▼
[6. POST-DELIVERY SLA REVIEW & WAREHOUSE SYNC]
Manager submits 8-factor review -> S/4HANA recalculates Trust Score in native SQL.
HANA Cloud records risk snapshot in PULSECHAIN_RISK_SNAPSHOTS & V_REGIONAL_EXEC_SUMMARY.
```

---

## 7. Diagnostics & System Verification Endpoints

The running server exposes live status endpoints for instant health auditing:

* **System Status & Health:** `GET https://plusechain.onrender.com/api/status`
* **SAP S/4HANA & HANA Cloud Diagnostic:** `GET https://plusechain.onrender.com/api/sap/status`
* **HANA Cloud Executive Analytics:** `GET https://plusechain.onrender.com/api/analytics/hana-cloud`
* **4-Stage Governed Disruption Analysis:** `POST https://plusechain.onrender.com/api/analyze-disruption`
