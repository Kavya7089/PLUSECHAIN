# PulseChain — Story-Driven Jury Demo Script

**Hackfest 2026 | Team Techy's (Group 418)**  
**Live App Link:** [https://plusechain.onrender.com/](https://plusechain.onrender.com/)  
**Duration:** 3 to 4 Minutes of Storytelling + Live Screen Interaction  
**Your Role:** Live Prototype Presenter (taking the handover right after your teammate explains the healthcare crisis and solution concept).

---

## 🎭 The Big Picture (Read This Before You Begin)

> **The Setup:** Your teammate just told the jury about the scary reality: how temperature-sensitive medicines like insulin and antivenom expire or run out during road floods and supply chain delays, leaving patients stranded.
>
> **Your Job:** Don't repeat the problem! Take the jury on an exciting, real-time journey:
> 1. Show the crisis happening live in Bhopal.
> 2. Let Governed SAP AI find the smartest rescue plan.
> 3. Show why real healthcare requires the physical Cold-Chain & Stock Verification Officer to verify the box before SAP ERP stock changes.
> 4. Close the loop with live SAP S/4HANA & HANA Cloud integration.

---

## 🎬 Step-by-Step Presentation Script

---

### PROLOGUE: The Handover (15 Seconds)

#### 🖥️ Screen: [Login Screen](https://plusechain.onrender.com/)
*(Have the login screen open on your laptop. Point your hand toward your teammate, smile, and turn to the jury).*

#### 🗣️ What to Say:
> *"Thank you, [Teammate's Name]!*  
> *(Turn warmly to the jury)*  
> *Respected members of the jury, now that you've seen the crisis on paper, let's step directly into the shoes of the doctors, warehouse staff, and regional directors across Madhya Pradesh.*  
>
> *Let's watch PulseChain solve a life-threatening medicine shortage live in real time."*

---

### ACT 1: Morning in Bhopal — Spotting the Stockout (1 Minute)

#### 🖥️ Screen Action:
Click the top-left card: **`Team Techy's — Regional Admin`** (`regional.head@pulsechain.org`).  
*(The screen wipes smoothly into the Regional Dashboard).*

#### 🗣️ What to Say:
> *(Point to the top status bar)*  
> *"It's 8:00 AM. I am logged in as the Regional Health Admin for Madhya Pradesh. Everything you see here is streaming live from **SAP S/4HANA** on Client 105.*
>
> *(Point to the yellow KPI cards)*  
> *Look at our main corridor: Bhopal, Indore, and Jabalpur. Most facilities are stable, but look at **Hospital H004 — Bhopal Apex Care**.*
>
> *Their Insulin stock has plummeted to just **3 days of cover**! Even worse, our live weather radar from Open-Meteo warns that heavy monsoon rain is flooding National Highway 46.*
>
> *(Scroll down to the SAP HANA Cloud card)*  
> *Behind the scenes, we don't just rely on transactional ERP. We also have **SAP HANA Cloud** running on port 443 as our executive analytics warehouse. Watch this—when I click **'Sync S/4HANA Snapshot to HANA Cloud'**..."*

#### 🖥️ Screen Action:
Click the yellow button: **`Sync S/4HANA Snapshot to HANA Cloud`**.  
Point to the green success banner.

#### 🗣️ What to Say:
> *"In less than 400 milliseconds, the live S/4HANA stock levels and real-time weather metrics are recorded into our column table in SAP HANA Cloud. The state leadership now has full visibility."*

---

### ACT 2: The Governed AI Rescue Plan (1 Minute 15 Seconds)

#### 🖥️ Screen Action:
Click **`Suppliers`** in the left sidebar to open the Master Vendor Ledger.

#### 🗣️ What to Say:
> *"Now, what would a traditional hospital do? They would panic, call commercial distributors, and place an emergency order that takes 12 days to arrive by ship and road. By then, diabetic patients would be in critical care.*
>
> *Let's see what happens when we click **'Run 4-Stage GenAI Analysis'**."*

#### 🖥️ Screen Action:
Click the yellow button: **`Run 4-Stage GenAI Analysis`**.  
The modal pops up with the simulated alert: *"Port of Mumbai closed for 12 days"*.  
**Point to the badges at the top of the modal.**

#### 🗣️ What to Say:
> *(Point with emphasis)*  
> *"Look at this badge: **SAP Generative AI Hub · 0418_PulseChain_Orchestration**.*  
>
> *In enterprise healthcare, you cannot simply send patient or doctor data into an unmonitored AI. Before any calculation starts, **SAP Data Privacy Integration** masks doctor names, emails, and phone numbers. Content safety filters ensure clean inputs.*
>
> *Now, let's run the analysis!"*

#### 🖥️ Screen Action:
Click the **Send / Run** button inside the modal.  
Wait 2 seconds as the plan loads.

#### 🗣️ What to Say:
> *(Smile and point to the results)*  
> *"Look at how smart the governed AI is:*
> 1. *It looks at our supplier list and **instantly rejects Supplier V1003** because SAP HANA flagged them for cold-chain temperature violations.*
> 2. *Instead of waiting 12 days for an import, it discovers that **Hospital H005—just across the city of Bhopal—has 4,500 surplus vials** in reserve!*
> 3. *It recommends a **Peer Transfer from Hub H005** with an emergency backup from Platinum Supplier V1001.*
> 4. *Road transit time? Just **4 hours** via highway instead of 12 days!"*

#### 🖥️ Screen Action:
Close the modal. On Supplier `V1001`, click **`OSRM Route`**.  
The Leaflet map shows the live highway polyline.

#### 🗣️ What to Say:
> *"Here is the real road route computed by OSRM on OpenStreetMap tiles. We enforce a strict **Travel Time + 1 Day** safety guardrail so medicines never sit on the road uncooled."*

---

### ACT 3: The Reality Check — Why AI Must Never Touch ERP Alone (1 Minute)

#### 🖥️ Screen Action:
Click **`Verify`** in the top-right persona switcher to switch to **Sejal Tiwari (Cold-Chain & Stock Verification Officer at H004)**.

#### 🗣️ What to Say:
> *(Ask the jury a rhetorical question, leaning forward slightly)*  
> *"Now, jury members, here is the million-dollar question:*  
> **Did our AI automatically update the inventory in SAP ERP?**  
>
> *(Shake head gently)*  
> ***No. And it should never do that.***  
>
> *In medicine, if an AI autonomously alters an ERP database, but the truck driver accidentally dropped the cooler or the refrigeration battery died on the road, your hospital records say you have insulin when in reality you have spoiled water. That is a regulatory and clinical disaster.*
>
> *That’s why PulseChain built the **2-Step Physical Verification Guardrail**:*
> - *First, the sending Cold-Chain & Stock Verification Officer at Hub H005 physically inspects the batch and clicks **Approve Dispatch**.*
> - *Second, meet Sejal here at Hospital H004. The medicine box arrives at her receiving bay. She opens the cold box, checks the digital data logger, and does a physical count.*
>
> *Watch what happens when Sejal clicks **'Submit Verified Physical Count'**..."*

#### 🖥️ Screen Action:
In the Verification & Cold-Chain Portal, click **`Submit Verified Physical Count`** for Insulin / Amoxicillin.  
Show the green toast notification.

#### 🗣️ What to Say:
> *"Only now—with human eyes verifying physical cold-chain integrity—does PulseChain fetch an authenticated CSRF token and execute an authorized OData `MERGE` into SAP S/4HANA `ZPULSE_INV`. The System of Record is updated safely and truthfully."*

---

### ACT 4: The Closed Loop & Grand Finale (30 Seconds)

#### 🖥️ Screen Action:
Click **`H004`** in the top switcher to switch to **Dr. Kavya (Hospital Manager)**.  
Point to the review section.

#### 🗣️ What to Say:
> *"To finish the story, Dr. Kavya submits a quick 8-factor delivery rating on temperature, arrival speed, and packaging.*
>
> *This sends the performance data right back into SAP S/4HANA, which **recalculates the vendor's Trust Score natively in SAP HANA SQL**—no React math, completely enterprise-driven.*
>
> *(Step back, look at the entire jury, and conclude with confidence)*  
>
> *Respected jury:*  
> *• We didn't build a mockup—we connected **live SAP S/4HANA**, **SAP HANA Cloud**, and **SAP Generative AI Hub**.*  
> *• We didn't let AI run wild—we protected the ERP with **PII masking** and **human physical verification**.*  
> *• And we proved that technology can save lives while keeping enterprise systems 100% compliant.*  
>
> *Thank you! We are excited to answer your questions."*

---

## 💡 Quick Tips for Stage Presence

1. **Don't rush!** Speak at a calm, confident storytelling pace.
2. **Use the 1-Click Persona Switcher:** The buttons in the top navbar (`H004`, `Verify`, `Admin`, `Vendor`) let you jump roles instantly without typing passwords.
3. **If a question gets technical:** Smile and point back to the architecture:
   - S/4HANA = The live transactional heart.
   - HANA Cloud = The executive time-series brain.
   - SAP AI Hub = The governed intelligence with privacy guardrails.
   - Cold-Chain & Stock Verification Officer = The physical reality check.

---

## 🎯 30-Second Answers to the Top 4 Jury Questions

### 1. "Is this S/4HANA connection actually live?"
> *"Yes, 100%! We are connected to SAP S/4HANA Gateway Client 105 over HTTPS OData v2 at Chico State University. You can open `/api/sap/status` on your phone right now and see the live ping, Client 105 handshake, and 37 inventory records."*

### 2. "Why do you need both S/4HANA and HANA Cloud?"
> *"They do two very different jobs: S/4HANA is our live transactional core that handles day-to-day stock balances and goods movement. SAP HANA Cloud on port 443 is our long-term analytical warehouse that logs historical disruption snapshots and runs heavy regional summaries without slowing down the hospital's operational ERP."*

### 3. "Why not let AI automatically transfer medicines without human approvals?"
> *"Because under healthcare regulations like FDA 21 CFR Part 11 and Good Distribution Practice, an algorithm cannot smell, touch, or inspect medicine vials. If a cold box failed mid-transit, blind automated database updates create 'ghost stock' that can kill patients. AI recommends; human verification officers verify."*

### 4. "What happens if weather or road APIs go down during a storm?"
> *"PulseChain is built to fail safely. If Open-Meteo or OSRM is unreachable, our backend automatically falls back to cached regional road matrices and historical weather benchmarks. S/4HANA and HANA Cloud keep running without a single hiccup."*
