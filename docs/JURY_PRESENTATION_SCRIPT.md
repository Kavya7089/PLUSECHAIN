# PulseChain — Jury Presentation Script & Screen Interaction Guide

**Hackfest 2026 | Team Techy's (Group 418)**  
**Live Production URL:** [https://plusechain.onrender.com/](https://plusechain.onrender.com/)  
**Target Duration:** 3 to 5 Minutes + Q&A  
**Core Theme:** *"Enterprise Resilience: Orchestrating 4 SAP Layers, Governed Business AI, and Physical Cold-Chain Reality."*

---

## 🎯 Quick Navigation & Pre-Demo Checklist

1. Open your browser with two tabs ready:
   - **Tab 1:** [https://plusechain.onrender.com/](https://plusechain.onrender.com/) (PulseChain Control Tower)
   - **Tab 2:** [https://plusechain.onrender.com/api/sap/status](https://plusechain.onrender.com/api/sap/status) (Live S/4HANA & HANA Cloud Diagnostic JSON)
2. Ensure you are logged out so you start at the **Login Screen**.
3. Keep the display in **Dark Mode** (or switch to Light Mode to prove high-contrast readability).

---

## ⏱️ Timeline & Presentation Flowchart

| Time | Phase | Role / Screen | Focus |
| :--- | :--- | :--- | :--- |
| **0:00 - 0:45** | The Hook & Architecture | Login Screen | 4 SAP Layers & 1-Click Multi-Tenant Login |
| **0:45 - 1:45** | Strategic Control Tower | Regional Admin | S/4HANA Inventory & HANA Cloud Warehouse Sync |
| **1:45 - 2:45** | Governed AI Disruption | Suppliers / AI Engine | `0418_PulseChain_Orchestration`, DPI Masking & OSRM |
| **2:45 - 3:30** | Human-in-the-Loop ERP | Shopkeeper Portal | 2-Step Physical Count Approval & S/4HANA MERGE |
| **3:30 - 4:00** | Closed-Loop Summary | Regional Dashboard | S/4HANA Native Trust Score & Conclusion |
| **4:00 - 5:00+**| Jury Q&A Defense | Any Screen | Defending ERP Integrity & Real-World Feasibility |

---

## 🎤 Act-by-Act Spoken Script with Exact Screen Actions

---

### ACT 1: The Hook & Enterprise Architecture (0:00 – 0:45)

#### 🖥️ On Screen: Login Screen (`https://plusechain.onrender.com/`)
*Point to the **Pre-Seeded Tenant Personas** and the **System Architecture** bento card on the right.*

#### 🗣️ What to Say:
> *"Respected members of the jury, when life-critical cold-chain medicines—like insulin or antivenom—face a highway washout or power outage, hospitals don't just need alerts. They need an authoritative, governed recovery plan that protects hospital budgets and prevents stockouts without bypassing ERP controls.*
>
> *Welcome to **PulseChain**. We did not build a standalone toy dashboard. PulseChain is an enterprise healthcare resilience control tower that orchestrates **four distinct SAP enterprise layers**:*
> 1. *Our entry point is **SAP Build Work Zone** on Fiori Launchpad.*
> 2. *Our operational System of Record is **Live SAP S/4HANA** over HTTPS OData v2.*
> 3. *Our executive warehouse is **SAP HANA Cloud** on port 443.*
> 4. *And our intelligence layer is governed by **SAP Generative AI Hub Orchestration** with automated PII masking.*
>
> *To demonstrate real multi-tenant security, we built 1-click persona switching."*

#### 👉 Screen Action:
Click the top-left persona card: **`Team Techy's — Regional Admin`** (`regional.head@pulsechain.org`).
The app logs in instantly and transitions with a clean staircase wipe into the **Regional Head Dashboard**.

---

### ACT 2: Regional Control Tower & Live SAP HANA Cloud (0:45 – 1:45)

#### 🖥️ On Screen: Screen 1 — Regional Head Dashboard
*Point to the **Live ERP Connected** indicator, the **SAP S/4HANA Inventory Grid**, and the **SAP HANA Cloud Executive Warehouse** panel.*

#### 🗣️ What to Say:
> *"Here on the Regional Executive Dashboard, every single inventory record you see is fetched live from SAP S/4HANA service `ZPLUSE_SRV` on Client 105. We track 37 live records across Bhopal, Indore, and Jabalpur.*
>
> *Notice our design system: 60% Abyss Teal canvas, 30% Sand Putty secondary cards, and 10% Taxi Volt for high-priority KPIs like critical days of cover.*
>
> *Look at this second bento card: **SAP HANA Cloud Executive Warehouse** (`Hackfest0418`). Our Node.js backend connects directly over TLS on port 443 using the native `hdb` driver to query column tables and view `V_REGIONAL_EXEC_SUMMARY`.*
>
> *Watch this: when I click **'Sync S/4HANA Snapshot to HANA Cloud'**, our backend captures the live S/4HANA inventory state alongside ambient temperature telemetry from Open-Meteo, committing a live row into `PULSECHAIN_RISK_SNAPSHOTS` in HANA Cloud in under 400 milliseconds."*

#### 👉 Screen Action:
1. Scroll down to the **SAP HANA Cloud Executive Analytics Warehouse** section.
2. Click the yellow button: **`Sync S/4HANA Snapshot to HANA Cloud`**.
3. Show the success banner: *"Live snapshot committed to SAP HANA Cloud table PULSECHAIN_RISK_SNAPSHOTS"*.

---

### ACT 3: Governed AI Disruption & OSRM Logistics (1:45 – 2:45)

#### 🖥️ On Screen: Navigate to Screen 4 — "Suppliers & Logistics"
*Click on **Suppliers** in the left sidebar.*

#### 🗣️ What to Say:
> *"Now let's examine supply-side resilience. Here in our Master Vendor Ledger, 11 suppliers are ranked. Notice this critical enterprise detail: **zero calculation happens in React**. The 8-factor Trust Score and Tiering—Platinum, Gold, Silver, and Blocked—are calculated natively via SAP HANA SQL pushdown inside S/4HANA.*
>
> *Notice supplier `V1003`—Reliant Cold-Chain Transport. S/4HANA has tagged them as **BLOCKED** because of cold-chain temperature excursions.*
>
> *Now, let's stress-test the system. I will trigger our **4-Stage GenAI Disruption Engine**."*

#### 👉 Screen Action:
1. Click the yellow button: **`Run 4-Stage GenAI Analysis`**.
2. A modal appears showing prompt input: *"Port of Mumbai closed for 12 days"*.
3. Point out the badge at the top of the modal:
   **`SAP Generative AI Hub · 0418_PulseChain_Orchestration`** with **`PII Masking & Content Safety Active`**.
4. Click **`Run 4-Stage Analysis`** (or the Send icon).

#### 🗣️ What to Say:
> *"Notice the governance badge: this execution adheres to pipeline `0418_PulseChain_Orchestration` configured in SAP AI Core resource group `Learning-AIG`.*
>
> *Before any prompt reaches model inference, SAP Data Privacy Integration rules redact doctor names, emails, and phone numbers. Simultaneously, Azure Content Safety enforces strict thresholds on input and output.*
>
> *Look at the AI recommendation:*
> 1. *It **refuses** to route through blocked supplier `V1003`.*
> 2. *Instead of an expensive 12-day import, it discovers that same-city hospital `H005` in Bhopal has 4,500 units of reserve stock.*
> 3. *It recommends a **Peer Transfer from Hub H005** with an OSRM road transit time of just 4 hours, and activates Platinum supplier `V1001` as commercial backup.*
> 4. *It enforces our **Travel Time + 1 Day** cold-chain delivery rule."*

5. Close the modal, find `V1001` on the table, and click **`OSRM Route`**.
6. Show the interactive Leaflet road map:
   *"Look at our road map—it renders the actual live OSRM driving polyline across Madhya Pradesh highway corridors on clean OpenStreetMap tiles with zero watermarks."*

---

### ACT 4: The 2-Step Shopkeeper Physical Verification Guardrail (2:45 – 3:30)

#### 🖥️ On Screen: Switch Persona to Shopkeeper (`H004 Shopkeeper`)
*In the top navbar, click the **Shop** persona shortcut (or use logout -> click Sejal Tiwari).*

#### 🗣️ What to Say:
> *"Now comes the most critical architectural decision in PulseChain: **The AI recommendation is never allowed to directly write to SAP ERP inventory.** In medical cold-chains, automated database writes cause ghost inventory and malpractice liability.*
>
> *Instead, PulseChain enforces a **2-Step Physical Verification Guardrail**:*
> * *Step 1: The dispatching shopkeeper at H005 physically counts the batch, checks temperature data loggers, and clicks **Approve Dispatch**.*
> * *Step 2: The receiving shopkeeper at H004 inspects the delivery at the bay and clicks **Approve Goods Receipt**.*
>
> *Watch this: when the Shopkeeper submits a physical count or confirms receipt, PulseChain generates an authenticated `x-csrf-token` and issues an authorized OData `MERGE` call to `InventorySet` in SAP S/4HANA. Only human physical count verification can alter the ERP single source of truth."*

#### 👉 Screen Action:
1. In the Shopkeeper Portal, point out the **Physical Stock Count Entry** for `INS001` and `OXY005`.
2. Click **Submit Verified Physical Count**.
3. Show the toast notification confirming live commit to SAP S/4HANA `ZPULSE_INV`.

---

### ACT 5: Closed Loop: Supplier Review & Conclusion (3:30 – 4:00)

#### 🖥️ On Screen: Switch to Hospital Manager (`H004 Manager`)
*Click **H004** in the top switcher.*

#### 🗣️ What to Say:
> *"To close the resilience loop: once a shipment arrives, the Hospital Manager completes an **8-Factor Post-Delivery Review** rating temperature stability, delivery speed, and documentation.*
>
> *Submitting this review posts directly to S/4HANA, which dynamically recalculates the vendor's Trust Score in native SAP HANA SQL, updating eligibility across the entire state in real time.*
>
> *To summarize:*
> - *We didn't mock SAP: we connected **SAP S/4HANA**, **SAP HANA Cloud**, **SAP AI Core Orchestration**, and **SAP Build Work Zone**.*
> - *We bridged ERP data with real-world weather, highway road routing, and physical bay verification.*
> - *And we deployed the entire stack live on Render.*
>
> *Thank you. We are eager to take your questions."*

---

## 🛡️ Winning Jury Q&A Defenses (Be Ready for These!)

### Q1: *"Is your SAP S/4HANA connection actually live, or is it hardcoded JSON?"*
> **Answer:** *"It is 100% live against SAP S/4HANA Gateway Client 105 at `https://merida.cob.csuchico.edu:8038/sap/opu/odata/sap/ZPLUSE_SRV`. You can open `https://plusechain.onrender.com/api/sap/status` in any browser right now: it returns `connectionStatus: LIVE_SAP`, active client 105, and live latency metrics. We only maintain a cached snapshot as an enterprise fallback in case university network tunnels go down."*

### Q2: *"How does SAP HANA Cloud differ from SAP S/4HANA in your project?"*
> **Answer:** *"They serve two distinct enterprise purposes following SAP clean core architecture:
> - **SAP S/4HANA** is our **OLTP (Transactional Core)**: it manages real-time stock balances (`ZPULSE_INV`), vendor contracts (`ZPULSE_SUPP`), and CSRF-protected goods movement.
> - **SAP HANA Cloud** is our **OLAP (Analytics Warehouse)**: our Node backend connects over TLS port 443 to store time-series snapshots (`PULSECHAIN_RISK_SNAPSHOTS`), historical delivery SLA logs (`PULSECHAIN_SUPPLIER_SLA`), and pre-aggregated regional health views (`V_REGIONAL_EXEC_SUMMARY`). S/4HANA handles the transaction; HANA Cloud handles executive intelligence."*

### Q3: *"Why doesn't your AI automatically transfer inventory when an alert occurs?"*
> **Answer:** *"That is a deliberate healthcare regulatory decision. An autonomous AI writing directly into pharmaceutical ERP is a compliance failure under FDA 21 CFR Part 11 and EU GMP Annex 11. An AI model cannot verify if a vial of insulin was accidentally frozen or broken on the highway. That's why PulseChain uses AI to **propose and coordinate**, but requires the **2-Step Shopkeeper physical count and receipt approval** before any stock delta is committed to S/4HANA."*

### Q4: *"How did you implement SAP Generative AI Hub governance?"*
> **Answer:** *"We created and validated pipeline `0418_PulseChain_Orchestration` (v1.0.0) in SAP AI Core resource group `Learning-AIG`. It enforces **SAP Data Privacy Integration (DPI)** to mask staff names, emails, and phone numbers before the prompt leaves the SAP boundary, paired with **Azure Content Safety** filtering at threshold 2. Our Node backend uses the `@sap-ai-sdk/orchestration` SDK and mirrors these exact DPI masking rules locally during inference."*

### Q5: *"What happens if road routing or weather APIs fail?"*
> **Answer:** *"PulseChain is built for resilience. If external OSRM road servers or Open-Meteo feeds fail, our backend falls back to deterministic geographic distance tables and historical regional weather models without crashing. The ERP core in S/4HANA and the analytics tables in HANA Cloud continue to operate unaffected."*
