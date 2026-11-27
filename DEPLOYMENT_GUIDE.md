# PulseChain Separate Deployment Guide (Backend & Frontend)

This guide explains how to deploy **PulseChain Backend** and **PulseChain Frontend** as two separate, decoupled cloud services (e.g., on Render, Vercel, or Railway).

---

## Architecture Overview

```
                      ┌───────────────────────────────────────────────┐
                      │    FRONTEND (Vite / React / Tailwind)        │
                      │    Hosted on: Render Static Site or Vercel    │
                      │    URL: https://pulsechain-frontend.onrender.com│
                      └───────────────────────┬───────────────────────┘
                                              │
                      REST API & JWT Auth     │  (VITE_API_BASE_URL)
                      CORS Enabled            ▼
                      ┌───────────────────────────────────────────────┐
                      │    BACKEND (Node.js / Express / SAP / AI)     │
                      │    Hosted on: Render Web Service              │
                      │    URL: https://pulsechain-backend.onrender.com│
                      └──────────────┬─────────────────┬──────────────┘
                                     │                 │
                           HTTPS OData v2              │ TLS Port 443
                                     ▼                 ▼
                         ┌───────────────────┐  ┌───────────────────┐
                         │   SAP S/4HANA     │  │  SAP HANA Cloud   │
                         │   Client 105      │  │  Hackfest0418     │
                         └───────────────────┘  └───────────────────┘
```

---

## Option 1: Instant 1-Click Deploy via Render Blueprint (`render.yaml`)

This repository contains a [`render.yaml`](./render.yaml) blueprint.

1. Open your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** ➔ **Blueprint**.
3. Connect your GitHub repository (`https://github.com/Kavya7089/PLUSECHAIN`).
4. Render will automatically detect the blueprint and configure:
   - **`pulsechain-backend`** (Web Service, isolated inside `backend/`)
   - **`pulsechain-frontend`** (Static Site, isolated inside `frontend/`)
5. Click **Apply**.

---

## Option 2: Manual Step-by-Step Deployment on Render

### Step A: Deploy the Backend (Web Service)

1. In Render Dashboard, click **New +** ➔ **Web Service**.
2. Select your GitHub repository: `https://github.com/Kavya7089/PLUSECHAIN`.
3. Configure these exact settings:

| Field | Value |
| :--- | :--- |
| **Name** | `pulsechain-backend` |
| **Language** | `Node` |
| **Branch** | `main` |
| **Root Directory** | **`backend`** *(Crucial: isolates the backend)* |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` *(or `node server.js`)* |
| **Instance Type** | Free |

4. In **Environment Variables**, add:
   ```ini
   PORT=5000
   NODE_ENV=production
   SAP_ODATA_URL=https://merida.cob.csuchico.edu:8038/sap/opu/odata/sap/ZPLUSE_SRV
   SAP_CLIENT=105
   SAP_USER=UTIT-036
   SAP_PASSWORD=your_sap_password
   HANA_HOST=64e8c26b-3e07-47e9-b246-617058b0306e.hna3.prod-eu10.hanacloud.ondemand.com
   HANA_PORT=443
   HANA_USER=Hackfest0418
   HANA_PASSWORD=your_hana_password
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   GEMINI_API_KEY=your_gemini_key
   ```
5. Click **Create Web Service**.
6. Once deployed, copy your backend URL (e.g., `https://pulsechain-backend.onrender.com`).

---

### Step B: Deploy the Frontend (Static Site)

1. In Render Dashboard, click **New +** ➔ **Static Site** (or use Vercel / Netlify).
2. Select your GitHub repository: `https://github.com/Kavya7089/PLUSECHAIN`.
3. Configure these exact settings:

| Field | Value |
| :--- | :--- |
| **Name** | `pulsechain-frontend` |
| **Branch** | `main` |
| **Root Directory** | **`frontend`** *(Crucial: isolates the frontend)* |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

4. In **Environment Variables**, add the single environment variable linking to your backend:
   ```ini
   VITE_API_BASE_URL=https://pulsechain-backend.onrender.com
   ```
   *(Replace with the actual URL from Step A)*

5. Under **Redirects/Rewrites**:
   - Add a rewrite: `/*` ➔ `/index.html` (Status: `Rewrite`). This enables client-side SPA routing.

6. Click **Create Static Site**.

---

## Local Development (Running Separately)

You can run both services independently in two terminal windows:

* **Terminal 1 (Backend):**
  ```powershell
  cd backend
  npm install
  npm start
  ```
  *Backend listens on `http://localhost:5000`*

* **Terminal 2 (Frontend):**
  ```powershell
  cd frontend
  npm install
  npm run dev
  ```
  *Frontend runs on `http://localhost:5173` and proxies calls to `http://localhost:5000`*
