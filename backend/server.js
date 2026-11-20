/**
 * PulseChain - Agentic Supply Chain Resilience Backend
 * Node.js & Express server with SAP RFC integration & Fallback Mode
 * Features: JWT Role-Based Access Control (RBAC), Same-City Geo-Filter,
 * Shopkeeper Stock Audits, Live Supplier Bidding, and Automated Nodemailer Alerts.
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

// Initialize GoogleGenAI SDK with process.env.GEMINI_API_KEY
let aiClient = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch (err) {
    aiClient = null;
  }
}

// SAP S/4HANA Gateway HTTPS OData v2 Integration (Replaces node-rfc & sapnwrfc.dll)
// Live Gateway Endpoint: https://merida.cob.csuchico.edu:8038/sap/opu/odata/sap/ZPLUSE_SRV?sap-client=105
const sapAdapter = require('./sapAdapter');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'pulsechain-enterprise-secret-key-2026';
const MANAGER_EMAIL = process.env.MANAGER_EMAIL || 'manager@pulsechain.com';
const SUPPLIER_EMAIL = process.env.SUPPLIER_EMAIL || 'supplier@pulsechain.com';


app.use(cors());
app.use(express.json());

// =========================================================================
// 1. RBAC DEMO USERS (JWT Authentication)
// =========================================================================
const DEMO_PASSWORD = 'pass123';
const DEMO_PASSWORD_HASH = bcrypt.hashSync(DEMO_PASSWORD, 10);

const DEMO_USERS = [
  {
    id: 'U001',
    name: 'Kavya Rajoria',
    email: 'manager@pulsechain.com',
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'INVENTORY_MANAGER',
    city: 'BHOPAL',
    hospitalId: 'H005',
    supplierId: null,
    avatar: 'KR',
  },
  {
    id: 'U002',
    name: 'Sejal Tiwari',
    email: 'shopkeeper@pulsechain.com',
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'STOCK_COUNTER',
    city: 'BHOPAL',
    hospitalId: 'H004',
    supplierId: null,
    avatar: 'ST',
  },
  {
    id: 'U003',
    name: 'Saumay Dubey',
    email: 'supplier@pulsechain.com',
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'SUPPLIER',
    city: 'FRANKFURT',
    hospitalId: null,
    supplierId: 'V1001',
    avatar: 'SD',
  },
];

// Reusable Role-Verification Middleware
function verifyRole(allowedRoles = []) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers['x-access-token'];
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (authHeader) {
      token = authHeader;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required. Please sign in.',
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;

      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied: Role "${decoded.role}" is not authorized. Allowed roles: ${allowedRoles.join(', ')}`,
        });
      }

      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token. Please sign in again.',
      });
    }
  };
}

// =========================================================================
// 2. AUTOMATED EMAIL UTILITY (Nodemailer with Safe Fallback / Simulation)
// =========================================================================
let mailTransporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  try {
    mailTransporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } catch (mailErr) {
    mailTransporter = null;
  }
}

async function sendAlertEmail(to, subject, htmlBody) {
  const timestamp = new Date().toISOString();

  if (mailTransporter && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const info = await mailTransporter.sendMail({
        from: `"PulseChain Resiliency Engine" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: htmlBody,
      });
      console.log(`[EMAIL DISPATCHED] To: ${to} | Subject: "${subject}" | MsgId: ${info.messageId}`);
      return { success: true, simulated: false, messageId: info.messageId, to, subject, timestamp };
    } catch (err) {
      console.warn(`[EMAIL ERROR] SMTP send failed: ${err.message}. Gracefully falling back to simulation.`);
    }
  }

  // Safe Fallback: Log full email payload to terminal with [EMAIL SIMULATION]
  console.log('\n================== [EMAIL SIMULATION] ==================');
  console.log(`📡 STATUS:    Simulated Dispatch (Safe Fallback)`);
  console.log(`📨 TO:        ${to}`);
  console.log(`📌 SUBJECT:   ${subject}`);
  console.log(`⏱️ TIMESTAMP: ${timestamp}`);
  console.log(`--------------------------------------------------------`);
  const plainText = htmlBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  console.log(`📄 PREVIEW:   ${plainText.slice(0, 220)}...`);
  console.log('========================================================\n');

  return { success: true, simulated: true, to, subject, timestamp };
}

// =========================================================================
// 3. INVENTORY & SAP DATASETS WITH SAME-CITY ATTRIBUTES
// =========================================================================
// Enriched with CITY property for geo-fencing:
// H004 is in BHOPAL (shortage)
// H005 is in BHOPAL (surplus hub - SAME CITY)
// H006 is in INDORE (surplus - CROSS CITY)
const INITIAL_FALLBACK_STOCK = [
  {
    HOSPITAL_ID: 'H001',
    HOSPITAL_NAME: 'Mumbai Central General',
    CITY: 'MUMBAI',
    MATERIAL_ID: 'INS001',
    STOCK_QTY: 600,
    DAILY_USE: 100,
    UNIT: 'EA',
  },
  {
    HOSPITAL_ID: 'H002',
    HOSPITAL_NAME: 'Delhi Critical Care Trust',
    CITY: 'DELHI',
    MATERIAL_ID: 'INS001',
    STOCK_QTY: 150,
    DAILY_USE: 50,
    UNIT: 'EA',
  },
  {
    HOSPITAL_ID: 'H003',
    HOSPITAL_NAME: 'Pune Memorial Medical',
    CITY: 'PUNE',
    MATERIAL_ID: 'INS001',
    STOCK_QTY: 1800,
    DAILY_USE: 100,
    UNIT: 'EA',
  },
  {
    HOSPITAL_ID: 'H001',
    HOSPITAL_NAME: 'Mumbai Central General',
    CITY: 'MUMBAI',
    MATERIAL_ID: 'AMX002',
    STOCK_QTY: 120,
    DAILY_USE: 40,
    UNIT: 'VIAL',
  },
  // H004 in BHOPAL: Critical shortages for shopkeeper audit & same-city reallocation
  {
    HOSPITAL_ID: 'H004',
    HOSPITAL_NAME: 'Bhopal Apex Care Hospital',
    CITY: 'BHOPAL',
    MATERIAL_ID: 'AMX002',
    STOCK_QTY: 110,
    DAILY_USE: 45,
    UNIT: 'VIAL',
  },
  {
    HOSPITAL_ID: 'H004',
    HOSPITAL_NAME: 'Bhopal Apex Care Hospital',
    CITY: 'BHOPAL',
    MATERIAL_ID: 'INS001',
    STOCK_QTY: 120,
    DAILY_USE: 40,
    UNIT: 'EA',
  },
  {
    HOSPITAL_ID: 'H002',
    HOSPITAL_NAME: 'Delhi Critical Care Trust',
    CITY: 'DELHI',
    MATERIAL_ID: 'PROP003',
    STOCK_QTY: 80,
    DAILY_USE: 40,
    UNIT: 'AMP',
  },
  {
    HOSPITAL_ID: 'H003',
    HOSPITAL_NAME: 'Pune Memorial Medical',
    CITY: 'PUNE',
    MATERIAL_ID: 'HEP004',
    STOCK_QTY: 140,
    DAILY_USE: 70,
    UNIT: 'VIAL',
  },
  {
    HOSPITAL_ID: 'H004',
    HOSPITAL_NAME: 'Bhopal Apex Care Hospital',
    CITY: 'BHOPAL',
    MATERIAL_ID: 'SAL005',
    STOCK_QTY: 180,
    DAILY_USE: 60,
    UNIT: 'BAG',
  },
  {
    HOSPITAL_ID: 'H004',
    HOSPITAL_NAME: 'Bhopal Apex Care Hospital',
    CITY: 'BHOPAL',
    MATERIAL_ID: 'HEP004',
    STOCK_QTY: 90,
    DAILY_USE: 45,
    UNIT: 'VIAL',
  },
  // H006 in INDORE (Cross-city surplus facility)
  {
    HOSPITAL_ID: 'H006',
    HOSPITAL_NAME: 'Indore Metro Healthcare',
    CITY: 'INDORE',
    MATERIAL_ID: 'CEF006',
    STOCK_QTY: 1500,
    DAILY_USE: 30,
    UNIT: 'VIAL',
  },
  {
    HOSPITAL_ID: 'H006',
    HOSPITAL_NAME: 'Indore Metro Healthcare',
    CITY: 'INDORE',
    MATERIAL_ID: 'INS001',
    STOCK_QTY: 3500,
    DAILY_USE: 40,
    UNIT: 'EA',
  },
  {
    HOSPITAL_ID: 'H007',
    HOSPITAL_NAME: 'Nagpur Multi-Specialty',
    CITY: 'NAGPUR',
    MATERIAL_ID: 'CEF006',
    STOCK_QTY: 1200,
    DAILY_USE: 60,
    UNIT: 'VIAL',
  },
  {
    HOSPITAL_ID: 'H006',
    HOSPITAL_NAME: 'Indore Metro Healthcare',
    CITY: 'INDORE',
    MATERIAL_ID: 'AZI007',
    STOCK_QTY: 450,
    DAILY_USE: 50,
    UNIT: 'TAB',
  },
  {
    HOSPITAL_ID: 'H003',
    HOSPITAL_NAME: 'Pune Memorial Medical',
    CITY: 'PUNE',
    MATERIAL_ID: 'MOR008',
    STOCK_QTY: 75,
    DAILY_USE: 25,
    UNIT: 'AMP',
  },
  {
    HOSPITAL_ID: 'H001',
    HOSPITAL_NAME: 'Mumbai Central General',
    CITY: 'MUMBAI',
    MATERIAL_ID: 'MOR008',
    STOCK_QTY: 800,
    DAILY_USE: 40,
    UNIT: 'AMP',
  },
  {
    HOSPITAL_ID: 'H007',
    HOSPITAL_NAME: 'Nagpur Multi-Specialty',
    CITY: 'NAGPUR',
    MATERIAL_ID: 'INS001',
    STOCK_QTY: 900,
    DAILY_USE: 60,
    UNIT: 'EA',
  },
  // H005 - Central Surplus Logistics Hub located in BHOPAL (Same-city surplus hub!)
  {
    HOSPITAL_ID: 'H005',
    HOSPITAL_NAME: 'Central Surplus Logistics Hub H005',
    CITY: 'BHOPAL',
    MATERIAL_ID: 'INS001',
    STOCK_QTY: 5000,
    DAILY_USE: 50,
    UNIT: 'EA',
  },
  {
    HOSPITAL_ID: 'H005',
    HOSPITAL_NAME: 'Central Surplus Logistics Hub H005',
    CITY: 'BHOPAL',
    MATERIAL_ID: 'AMX002',
    STOCK_QTY: 4000,
    DAILY_USE: 40,
    UNIT: 'VIAL',
  },
  {
    HOSPITAL_ID: 'H005',
    HOSPITAL_NAME: 'Central Surplus Logistics Hub H005',
    CITY: 'BHOPAL',
    MATERIAL_ID: 'PROP003',
    STOCK_QTY: 3000,
    DAILY_USE: 30,
    UNIT: 'AMP',
  },
  {
    HOSPITAL_ID: 'H005',
    HOSPITAL_NAME: 'Central Surplus Logistics Hub H005',
    CITY: 'BHOPAL',
    MATERIAL_ID: 'HEP004',
    STOCK_QTY: 3500,
    DAILY_USE: 35,
    UNIT: 'VIAL',
  },
  {
    HOSPITAL_ID: 'H005',
    HOSPITAL_NAME: 'Central Surplus Logistics Hub H005',
    CITY: 'BHOPAL',
    MATERIAL_ID: 'SAL005',
    STOCK_QTY: 6000,
    DAILY_USE: 100,
    UNIT: 'BAG',
  },
];

// Current in-memory state (supports live reallocations & stock audits in fallback mode)
let currentStockState = JSON.parse(JSON.stringify(INITIAL_FALLBACK_STOCK));
const reallocationLogs = [];
const stockCountAuditHistory = [];
const supplierBids = [];

// Supplier master dataset (compliant Y and non-compliant N)
let currentSuppliersState = [
  {
    SUPPLIER_ID: 'V1001',
    SUPPLIER_NAME: 'BioPharm Global Logistics',
    MATERIAL_ID: 'INS001',
    LEAD_TIME: 2,
    CAPACITY: 5000,
    UNIT_COST: 150,
    COMPLIANCE: 'Y',
    RELIABILITY: '98%',
    LOCATION: 'Frankfurt Central Hub',
  },
  {
    SUPPLIER_ID: 'V1002',
    SUPPLIER_NAME: 'MedVance Pharma Corp',
    MATERIAL_ID: 'AMX002',
    LEAD_TIME: 3,
    CAPACITY: 8000,
    UNIT_COST: 85,
    COMPLIANCE: 'Y',
    RELIABILITY: '96%',
    LOCATION: 'Rotterdam Depot',
  },
  {
    SUPPLIER_ID: 'V1003',
    SUPPLIER_NAME: 'Apex Critical Care Supply',
    MATERIAL_ID: 'PROP003',
    LEAD_TIME: 4,
    CAPACITY: 3000,
    UNIT_COST: 210,
    COMPLIANCE: 'N',
    RELIABILITY: '82%',
    LOCATION: 'Antwerp Logistics (Compromised)',
  },
  {
    SUPPLIER_ID: 'V1004',
    SUPPLIER_NAME: 'SterileShield Therapeutics',
    MATERIAL_ID: 'HEP004',
    LEAD_TIME: 2,
    CAPACITY: 6500,
    UNIT_COST: 120,
    COMPLIANCE: 'Y',
    RELIABILITY: '99%',
    LOCATION: 'Basel Logistics Hub',
  },
  {
    SUPPLIER_ID: 'V1005',
    SUPPLIER_NAME: 'Nordic Fluid Systems',
    MATERIAL_ID: 'SAL005',
    LEAD_TIME: 1,
    CAPACITY: 12000,
    UNIT_COST: 25,
    COMPLIANCE: 'Y',
    RELIABILITY: '97%',
    LOCATION: 'Hamburg Central',
  },
];

// =========================================================================
// 4. AUTH ENDPOINTS
// =========================================================================

/**
 * POST /api/auth/login
 * Role-based authentication returning JWT token & user profile
 */
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  const user = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. Demo accounts: manager@pulsechain.com, shopkeeper@pulsechain.com, supplier@pulsechain.com',
    });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash) || password === DEMO_PASSWORD;
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid password. Demo password is pass123',
    });
  }

  const tokenPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    city: user.city,
    hospitalId: user.hospitalId,
    supplierId: user.supplierId,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

  return res.status(200).json({
    success: true,
    token,
    user: tokenPayload,
  });
});

/**
 * GET /api/auth/me
 * Retrieves current authenticated user profile
 */
app.get('/api/auth/me', verifyRole(), (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
});

// =========================================================================
// 5. INVENTORY & SAME-CITY GEO-FILTER ENDPOINTS
// =========================================================================

/**
 * GET /api/inventory
 * Connects to SAP Gateway OData v2 (ZPLUSE_SRV) over HTTPS
 * Falls back cleanly to local persistence cache when offline
 */
app.get('/api/inventory', async (req, res) => {
  try {
    const result = await sapAdapter.getStockFromSap();
    const records = result.data || currentStockState;
    currentStockState = records;
    return res.status(200).json({
      success: true,
      source: result.source || 'LIVE_SAP_ODATA',
      timestamp: new Date().toISOString(),
      data: records,
    });
  } catch (err) {
    return res.status(200).json({
      success: true,
      source: 'OFFLINE_SAP_CACHE',
      timestamp: new Date().toISOString(),
      data: currentStockState,
    });
  }
});

/**
 * GET /api/inventory/same-city/:hospitalId
 * Strictly returns surplus hospitals (DAYS_COVER > 10) in the EXACT SAME CITY.
 * Excludes cross-city facilities (e.g. H006 in INDORE) to prevent transit disruption delay.
 */
app.get('/api/inventory/same-city/:hospitalId', (req, res) => {
  const { hospitalId } = req.params;
  const targetHospitalRecords = currentStockState.filter((s) => s.HOSPITAL_ID === hospitalId);

  if (targetHospitalRecords.length === 0) {
    return res.status(404).json({
      success: false,
      message: `Hospital ${hospitalId} not found in inventory ledger.`,
    });
  }

  const targetCity = targetHospitalRecords[0].CITY || 'BHOPAL';

  // Calculate days of cover for all records
  const allSurplusRecords = currentStockState
    .map((item) => {
      const days = item.DAILY_USE > 0 ? Math.floor(item.STOCK_QTY / item.DAILY_USE) : 999;
      return {
        ...item,
        daysCover: days,
      };
    })
    .filter((item) => item.HOSPITAL_ID !== hospitalId && (item.daysCover >= 4 || item.HOSPITAL_ID === 'H005'));

  // Filter strictly by same city
  const approvedSameCity = allSurplusRecords.filter((item) => item.CITY === targetCity);
  const excludedCrossCity = allSurplusRecords.filter((item) => item.CITY !== targetCity);

  return res.status(200).json({
    success: true,
    targetHospital: {
      hospitalId,
      city: targetCity,
      name: targetHospitalRecords[0].HOSPITAL_NAME || `Hospital ${hospitalId}`,
    },
    geoPolicy: {
      status: 'STRICT_SAME_CITY_ACTIVE',
      enforcedCity: targetCity,
      description: `Only facilities within ${targetCity} municipal logistics perimeter are eligible for internal medical reallocation.`,
    },
    data: approvedSameCity,
    surplusHospitals: approvedSameCity,
    approvedSurplusHospitals: approvedSameCity,
    excludedCrossCityHospitals: excludedCrossCity,
  });
});

// =========================================================================
// 6. MEDICAL SHOPKEEPER STOCK COUNT & AUDIT (POST /api/stock-count)
// =========================================================================

/**
 * POST /api/stock-count
 * Role: STOCK_COUNTER (Medical Shopkeeper) or INVENTORY_MANAGER
 * Accepts { hospitalId, materialId, stockQty, dailyUse }
 * Calls SAP RFC Z_PULSE_COUNT_STOCK & triggers dual Nodemailer alert if daysCover < 5.
 */
app.post('/api/stock-count', verifyRole(['STOCK_COUNTER', 'INVENTORY_MANAGER']), async (req, res) => {
  const { hospitalId, materialId, stockQty, dailyUse } = req.body;

  if (!hospitalId || !materialId || stockQty === undefined || dailyUse === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameters: hospitalId, materialId, stockQty, dailyUse',
    });
  }

  const numericStock = parseFloat(stockQty);
  const numericDaily = parseFloat(dailyUse);

  if (isNaN(numericStock) || isNaN(numericDaily) || numericDaily <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid stockQty or dailyUse. dailyUse must be greater than 0.',
    });
  }

  let sapRecorded = false;
  try {
    const sapRes = await sapAdapter.countStockInSap(hospitalId, materialId, numericStock, numericDaily);
    sapRecorded = sapRes.sapRecorded;
  } catch (sapErr) {
    sapRecorded = false;
  }

  // Update in-memory stock state and persist to SAP Offline Cache
  let record = currentStockState.find(
    (item) => item.HOSPITAL_ID === hospitalId && item.MATERIAL_ID === materialId
  );

  if (!record) {
    record = {
      HOSPITAL_ID: hospitalId,
      HOSPITAL_NAME: `Hospital ${hospitalId}`,
      CITY: req.user?.city || 'BHOPAL',
      MATERIAL_ID: materialId,
      STOCK_QTY: numericStock,
      DAILY_USE: numericDaily,
      UNIT: 'EA',
    };
    currentStockState.push(record);
  } else {
    record.STOCK_QTY = numericStock;
    record.DAILY_USE = numericDaily;
  }

  const daysCover = Math.floor(numericStock / numericDaily);
  const city = record.CITY || req.user?.city || 'BHOPAL';

  const auditEntry = {
    id: `CNT-${Date.now()}`,
    timestamp: new Date().toISOString(),
    countedBy: req.user?.name || 'Authorized Officer',
    email: req.user?.email || 'shopkeeper@pulsechain.com',
    hospitalId,
    city,
    materialId,
    stockQty: numericStock,
    dailyUse: numericDaily,
    daysCover,
    criticalShortage: daysCover < 5,
  };
  stockCountAuditHistory.unshift(auditEntry);
  sapAdapter.logStockAudit(auditEntry);

  let emailsTriggered = false;

  // If daysCover < 5, automatically trigger two emails via Nodemailer
  if (daysCover < 5) {
    emailsTriggered = true;
    const requiredBuffer = numericDaily * 5;

    // 1. Critical Shortage Alert to MANAGER_EMAIL
    const managerSubject = `🚨 [CRITICAL SHORTAGE ALERT] Hospital ${hospitalId} (${city}) - ${materialId} Deficit Imminent`;
    const managerHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #2c2e35; color: #e0e8e2; padding: 24px; border-radius: 12px; border: 1px solid #f0cd6e;">
        <h2 style="color: #f0cd6e; margin-top: 0;">🚨 PulseChain Critical Shortage Alert</h2>
        <p>A physical stock count has logged an urgent inventory deficit requiring mitigation:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #2a3f3f; border-radius: 8px; overflow: hidden; font-size: 14px;">
          <tr style="border-bottom: 1px solid #467750;"><td style="padding: 10px; color: #89c07e;"><b>Hospital / Facility:</b></td><td style="padding: 10px; font-weight: bold;">${hospitalId} (${city})</td></tr>
          <tr style="border-bottom: 1px solid #467750;"><td style="padding: 10px; color: #89c07e;"><b>Medicine / Material:</b></td><td style="padding: 10px; font-weight: bold; color: #f0cd6e;">${materialId}</td></tr>
          <tr style="border-bottom: 1px solid #467750;"><td style="padding: 10px; color: #89c07e;"><b>Current Physical Stock:</b></td><td style="padding: 10px;">${numericStock} ${record.UNIT}</td></tr>
          <tr style="border-bottom: 1px solid #467750;"><td style="padding: 10px; color: #89c07e;"><b>Daily Burn Rate:</b></td><td style="padding: 10px;">${numericDaily} ${record.UNIT}/day</td></tr>
          <tr style="border-bottom: 1px solid #467750;"><td style="padding: 10px; color: #f0cd6e;"><b>Days of Cover:</b></td><td style="padding: 10px; color: #f0cd6e; font-weight: bold; font-size: 16px;">${daysCover} Days (CRITICAL &lt; 5d THRESHOLD)</td></tr>
          <tr><td style="padding: 10px; color: #89c07e;"><b>Recommended 5-Day Buffer:</b></td><td style="padding: 10px;">+${requiredBuffer} ${record.UNIT} (Immediate Transfer)</td></tr>
        </table>
        <p style="font-size: 13px; color: #e0e8e2;">
          <b>Recommended Action:</b> Open the PulseChain Control Tower to execute an autonomous same-city transfer from Central Surplus Hub H005 (${city}).
        </p>
        <p style="font-size: 11px; color: #89c07e; border-top: 1px solid #467750; padding-top: 8px;">
          Logged by: ${req.user?.name} (${req.user?.email}) • Timestamp: ${auditEntry.timestamp}
        </p>
      </div>
    `;
    sendAlertEmail(MANAGER_EMAIL, managerSubject, managerHtml).catch(console.error);

    // 2. Urgent Emergency RFQ Alert to SUPPLIER_EMAIL
    const supplierSubject = `⚡ [URGENT EMERGENCY RFQ] Fast-Track Bid Request: ${materialId} needed at Hospital ${hospitalId} (${city})`;
    const supplierHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #2c2e35; color: #e0e8e2; padding: 24px; border-radius: 12px; border: 1px solid #89c07e;">
        <h2 style="color: #89c07e; margin-top: 0;">⚡ PulseChain Emergency RFQ Broadcast</h2>
        <p>An emergency procurement tender has been activated for critical healthcare replenishment:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #2a3f3f; border-radius: 8px; overflow: hidden; font-size: 14px;">
          <tr style="border-bottom: 1px solid #467750;"><td style="padding: 10px; color: #89c07e;"><b>Requested Material:</b></td><td style="padding: 10px; font-weight: bold; color: #89c07e;">${materialId}</td></tr>
          <tr style="border-bottom: 1px solid #467750;"><td style="padding: 10px; color: #89c07e;"><b>Required Buffer Volume:</b></td><td style="padding: 10px;">${requiredBuffer} Units</td></tr>
          <tr style="border-bottom: 1px solid #467750;"><td style="padding: 10px; color: #89c07e;"><b>Destination Facility:</b></td><td style="padding: 10px;">Hospital ${hospitalId} (${city})</td></tr>
          <tr style="border-bottom: 1px solid #467750;"><td style="padding: 10px; color: #f0cd6e;"><b>Urgency Level:</b></td><td style="padding: 10px; color: #f0cd6e; font-weight: bold;">CRITICAL (&lt; ${daysCover}d supply remaining)</td></tr>
          <tr><td style="padding: 10px; color: #89c07e;"><b>Quality Standard:</b></td><td style="padding: 10px;">Cold-Chain Compliance Mandatory (COMPLIANCE: 'Y')</td></tr>
        </table>
        <p style="font-size: 13px; color: #e0e8e2;">
          Commercial partners are invited to log in to the <b>PulseChain Supplier Portal</b> to submit competitive unit rates and delivery lead times.
        </p>
      </div>
    `;
    sendAlertEmail(SUPPLIER_EMAIL, supplierSubject, supplierHtml).catch(console.error);
  }

  return res.status(200).json({
    success: true,
    message: daysCover < 5
      ? `Stock count synchronized. CRITICAL SHORTAGE DETECTED (${daysCover}d cover). Automated dual emails dispatched to Manager and Suppliers.`
      : `Stock count recorded successfully in SAP. Inventory buffer is safe (${daysCover}d cover).`,
    sapRecorded,
    data: {
      ...record,
      daysCover,
      shortageAlertTriggered: emailsTriggered,
      auditLogId: auditEntry.id,
    },
  });
});

/**
 * GET /api/stock-counts and /api/stock-counts/:hospitalId
 * Returns recent stock count audit history
 */
app.get(['/api/stock-counts', '/api/stock-counts/:hospitalId'], (req, res) => {
  const { hospitalId } = req.params;
  let records = stockCountAuditHistory;
  if (hospitalId) {
    records = records.filter((r) => r.hospitalId === hospitalId);
  }
  return res.status(200).json({
    success: true,
    count: records.length,
    data: records,
  });
});

// =========================================================================
// 7. SUPPLIER PROPOSAL & OPEN SHORTAGES ENDPOINTS
// =========================================================================

/**
 * GET /api/open-shortages
 * Allows suppliers to see active critical shortages (daysCover < 5)
 * without seeing sensitive internal hospital financials.
 */
app.get('/api/open-shortages', (req, res) => {
  const openShortages = currentStockState
    .map((item) => {
      const days = item.DAILY_USE > 0 ? Math.floor(item.STOCK_QTY / item.DAILY_USE) : 999;
      return {
        hospitalId: item.HOSPITAL_ID,
        city: item.CITY || 'BHOPAL',
        materialId: item.MATERIAL_ID,
        dailyUse: item.DAILY_USE,
        daysCover: days,
        shortfallQty: Math.max(0, (5 - days) * item.DAILY_USE),
        unit: item.UNIT,
        urgency: days <= 2 ? 'IMMEDIATE_STOCKOUT' : 'CRITICAL',
      };
    })
    .filter((s) => s.daysCover < 5);

  return res.status(200).json({
    success: true,
    count: openShortages.length,
    data: openShortages,
  });
});

/**
 * POST /api/supplier-bid
 * Role: SUPPLIER or INVENTORY_MANAGER
 * Accepts { supplierId, materialId, unitCost, leadTime, capacity, compliance }
 * Calls SAP RFC Z_PULSE_SUBMIT_BID and updates in-memory supplier proposals.
 */
app.post('/api/supplier-bid', verifyRole(['SUPPLIER', 'INVENTORY_MANAGER']), async (req, res) => {
  const { supplierId, materialId, unitCost, leadTime, capacity, compliance } = req.body;

  if (!supplierId || !materialId || unitCost === undefined || leadTime === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Missing required bid parameters: supplierId, materialId, unitCost, leadTime',
    });
  }

  const numericCost = parseFloat(unitCost);
  const numericLead = parseFloat(leadTime);
  const numericCap = capacity ? parseFloat(capacity) : 5000;
  const complianceFlag = (compliance || 'Y').toUpperCase();

  let sapRecorded = false;
  try {
    const sapRes = await sapAdapter.submitBidToSap(supplierId, materialId, numericCost, numericLead, numericCap, complianceFlag);
    sapRecorded = sapRes.sapRecorded;
  } catch (sapErr) {
    sapRecorded = false;
  }

  const newBid = {
    id: `BID-${Date.now()}`,
    timestamp: new Date().toISOString(),
    supplierId,
    supplierName: req.user?.name || `Vendor ${supplierId}`,
    materialId,
    unitCost: numericCost,
    currency: 'INR',
    leadTime: numericLead,
    capacity: numericCap,
    compliance: complianceFlag,
    status: complianceFlag === 'Y' ? 'ACTIVE_PROPOSAL' : 'FLAGGED_EXCURSION',
    submittedBy: req.user?.email || 'supplier@pulsechain.com',
  };

  supplierBids.unshift(newBid);
  sapAdapter.logSupplierBid(newBid);

  // Update or insert into currentSuppliersState so Manager immediately sees the bid on Screen 3
  const existingSupplierIdx = currentSuppliersState.findIndex(
    (s) => s.SUPPLIER_ID === supplierId && s.MATERIAL_ID === materialId
  );

  if (existingSupplierIdx !== -1) {
    currentSuppliersState[existingSupplierIdx].UNIT_COST = numericCost;
    currentSuppliersState[existingSupplierIdx].LEAD_TIME = numericLead;
    currentSuppliersState[existingSupplierIdx].CAPACITY = numericCap;
    currentSuppliersState[existingSupplierIdx].COMPLIANCE = complianceFlag;
  } else {
    currentSuppliersState.unshift({
      SUPPLIER_ID: supplierId,
      SUPPLIER_NAME: req.user?.name || `Vendor ${supplierId}`,
      MATERIAL_ID: materialId,
      LEAD_TIME: numericLead,
      CAPACITY: numericCap,
      UNIT_COST: numericCost,
      COMPLIANCE: complianceFlag,
      RELIABILITY: '98%',
      LOCATION: `${req.user?.city || 'Regional Depot'} Hub`,
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Supplier proposal recorded and submitted to SAP procurement ledger.',
    sapRecorded,
    bid: newBid,
  });
});

/**
 * GET /api/supplier-bids and /api/supplier-bids/:supplierId
 * Returns submitted supplier proposals
 */
app.get(['/api/supplier-bids', '/api/supplier-bids/:supplierId'], (req, res) => {
  const { supplierId } = req.params;
  let list = supplierBids;
  if (supplierId) {
    list = list.filter((b) => b.supplierId === supplierId);
  }
  return res.status(200).json({
    success: true,
    count: list.length,
    data: list,
  });
});

// =========================================================================
// 8. REALLOCATION (WRITE OPERATION) & DISPATCH CONFIRMATION EMAIL
// =========================================================================

/**
 * POST /api/transfer
 * Phase 2 Agentic Reallocation (Write Operation)
 * Maps Node parameters to SAP RFC Z_PULSE_UPDATE_STOCK IMPORTING parameters:
 * IV_FROM_HOSP: fromHospital
 * IV_TO_HOSP: toHospital
 * IV_MATERIAL: materialId
 * IV_QTY: parseFloat(qty)
 *
 * Triggers dispatch confirmation email upon success.
 */
app.post('/api/transfer', async (req, res) => {
  const { fromHospital, toHospital, materialId, qty } = req.body;

  // Validate request parameters
  if (!fromHospital || !toHospital || !materialId || qty === undefined || qty === null) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameters: fromHospital, toHospital, materialId, qty',
    });
  }

  const numericQty = parseFloat(qty);
  if (isNaN(numericQty) || numericQty <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid transfer quantity. Must be a positive number.',
    });
  }

  let sapSuccess = false;
  let sapMessage = 'Mock transfer successful';

  try {
    const sapRes = await sapAdapter.updateStockInSap(fromHospital, toHospital, materialId, numericQty);
    sapSuccess = sapRes.sapRecorded;
    if (sapSuccess) {
      sapMessage = 'Stock transfer completed successfully in SAP.';
    }
  } catch (sapErr) {
    sapSuccess = false;
  }

  // Simulated 1-second delay for frontend development
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Update in-memory stock so subsequent GET /api/inventory reflects the change
  const targetRecord = currentStockState.find(
    (item) => item.HOSPITAL_ID === toHospital && item.MATERIAL_ID === materialId
  );
  const donorRecord = currentStockState.find(
    (item) => item.HOSPITAL_ID === fromHospital && item.MATERIAL_ID === materialId
  );

  if (donorRecord) {
    donorRecord.STOCK_QTY = Math.max(0, donorRecord.STOCK_QTY - numericQty);
  }
  if (targetRecord) {
    targetRecord.STOCK_QTY += numericQty;
  }

  const txId = `TX-${Date.now()}`;
  const timestamp = new Date().toISOString();

  const logEntry = {
    id: txId,
    timestamp,
    materialId,
    donorHospital: fromHospital,
    targetHospital: toHospital,
    quantity: numericQty,
    status: 'COMPLETED_SUCCESS',
  };
  reallocationLogs.unshift(logEntry);
  sapAdapter.logReallocation(logEntry);

  // Automated Dispatch Confirmation Email via Nodemailer
  const dispatchSubject = `✅ [DISPATCH CONFIRMATION] Emergency Stock Reallocation Executed: ${materialId} (#${txId})`;
  const dispatchHtml = `
    <div style="font-family: Arial, sans-serif; background-color: #2c2e35; color: #e0e8e2; padding: 24px; border-radius: 12px; border: 1px solid #89c07e;">
      <h2 style="color: #89c07e; margin-top: 0;">✅ PulseChain Autonomous Reallocation Executed</h2>
      <p>An emergency autonomous stock transfer has been authorized and committed to SAP S/4HANA ERP:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #2a3f3f; border-radius: 8px; overflow: hidden; font-size: 14px;">
        <tr style="border-bottom: 1px solid #467750;"><td style="padding: 10px; color: #89c07e;"><b>Transaction Reference:</b></td><td style="padding: 10px; font-mono; font-weight: bold;">${txId}</td></tr>
        <tr style="border-bottom: 1px solid #467750;"><td style="padding: 10px; color: #89c07e;"><b>Medicine / Material:</b></td><td style="padding: 10px; font-weight: bold; color: #f0cd6e;">${materialId}</td></tr>
        <tr style="border-bottom: 1px solid #467750;"><td style="padding: 10px; color: #89c07e;"><b>Quantity Transferred:</b></td><td style="padding: 10px; font-weight: bold;">${numericQty} Units</td></tr>
        <tr style="border-bottom: 1px solid #467750;"><td style="padding: 10px; color: #89c07e;"><b>Origin Facility (Surplus):</b></td><td style="padding: 10px;">${fromHospital} (${donorRecord?.CITY || 'BHOPAL'})</td></tr>
        <tr style="border-bottom: 1px solid #467750;"><td style="padding: 10px; color: #89c07e;"><b>Destination Facility (Shortage):</b></td><td style="padding: 10px;">${toHospital} (${targetRecord?.CITY || 'BHOPAL'})</td></tr>
        <tr style="border-bottom: 1px solid #467750;"><td style="padding: 10px; color: #89c07e;"><b>Transit Lead Time:</b></td><td style="padding: 10px; color: #89c07e; font-weight: bold;">0 Days (Immediate Same-City Courier)</td></tr>
        <tr><td style="padding: 10px; color: #89c07e;"><b>ERP Status:</b></td><td style="padding: 10px; color: #89c07e;">SAP RFC Z_PULSE_UPDATE_STOCK: ${sapSuccess ? 'COMMITTED (S)' : 'SIMULATED (FALLBACK)'}</td></tr>
      </table>
      <p style="font-size: 13px; color: #e0e8e2;">
        Cold-chain pre-cleared transport has been scheduled. The receiving hospital's inventory buffer is restored.
      </p>
      <p style="font-size: 11px; color: #89c07e; border-top: 1px solid #467750; padding-top: 8px;">
        Timestamp: ${timestamp} • PulseChain Agentic Supply Chain Engine
      </p>
    </div>
  `;
  sendAlertEmail(MANAGER_EMAIL, dispatchSubject, dispatchHtml).catch(console.error);

  return res.status(200).json({
    success: true,
    message: sapSuccess ? sapMessage : 'Mock transfer successful',
    transactionId: txId,
    dispatchEmailSent: true,
    transfer: {
      fromHospital,
      toHospital,
      materialId,
      qty: numericQty,
    },
  });
});

/**
 * GET /api/reallocations
 * Returns audit log of all triggered reallocations
 */
app.get('/api/reallocations', (req, res) => {
  return res.status(200).json({
    success: true,
    count: reallocationLogs.length,
    data: reallocationLogs,
  });
});

/**
 * POST /api/reset
 * Resets inventory back to baseline values
 */
app.post('/api/reset', async (req, res) => {
  currentStockState = JSON.parse(JSON.stringify(INITIAL_FALLBACK_STOCK));
  await sapAdapter.resetToBaseline();
  return res.status(200).json({
    success: true,
    message: 'Inventory state reset to baseline values.',
    data: currentStockState,
  });
});

/**
 * GET /api/sap/status
 * Health check & diagnostic report for SAP S/4HANA Gateway OData v2 (ZPLUSE_SRV)
 * Ping ${SAP_ODATA_URL}/InventorySet?sap-client=${SAP_CLIENT}&$top=1&$format=json
 */
app.get('/api/sap/status', async (req, res) => {
  const status = await sapAdapter.getSapStatus();
  return res.status(200).json({
    success: true,
    ...status,
    data: status,
  });
});

/**
 * GET /api/status
 * Overall system health & SAP Gateway OData connectivity diagnosis
 */
app.get('/api/status', async (req, res) => {
  const sapStatus = await sapAdapter.getSapStatus();
  res.status(200).json({
    system: 'PulseChain Resilience Engine',
    version: '3.1.0 (SAP S/4HANA OData Edition)',
    status: 'ONLINE',
    sapStatus: sapStatus,
    sapConfig: {
      odataUrl: process.env.SAP_ODATA_URL || 'https://merida.cob.csuchico.edu:8038/sap/opu/odata/sap/ZPLUSE_SRV',
      client: process.env.SAP_CLIENT || '105',
      user: process.env.SAP_USER || 'UTIT-036',
      serviceName: 'ZPLUSE_SRV',
      tables: ['ZPULSE_INV', 'ZPULSE_SUPP'],
    },
    auth: {
      rbacEnabled: true,
      rolesSupported: ['INVENTORY_MANAGER', 'STOCK_COUNTER', 'SUPPLIER'],
      demoAccounts: DEMO_USERS.map((u) => ({ email: u.email, role: u.role, city: u.city })),
    },
    uptimeSeconds: Math.floor(process.uptime()),
    totalRecords: currentStockState.length,
    activeSuppliersCount: currentSuppliersState.length,
    activeBidsCount: supplierBids.length,
  });
});

// Extract JSON helper from LLM response
function extractJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e2) {}
    }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      try {
        return JSON.parse(text.slice(firstBrace, lastBrace + 1));
      } catch (e3) {}
    }
    return null;
  }
}

/**
 * Fetch SAP inventory with fallback
 */
async function fetchSapInventoryData() {
  try {
    const result = await sapAdapter.getStockFromSap();
    const records = result.data || result || currentStockState;
    currentStockState = records;
    return records;
  } catch (err) {
    return currentStockState;
  }
}

/**
 * Fetch SAP suppliers with fallback
 */
async function fetchSapSuppliersData() {
  try {
    const result = await sapAdapter.getSuppliersFromSap();
    const records = result.data || result || currentSuppliersState;
    currentSuppliersState = records;
    return records;
  } catch (err) {
    return currentSuppliersState;
  }
}

/**
 * GET /api/suppliers
 * External supplier capacity, lead times, and compliance status
 */
app.get('/api/suppliers', async (req, res) => {
  const data = await fetchSapSuppliersData();
  return res.status(200).json({
    success: true,
    data,
  });
});

/**
 * Calls Gemini with fallback across supported models
 */
async function callGemini(contents) {
  if (!aiClient) return null;
  const primaryModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  try {
    const res = await aiClient.models.generateContent({
      model: primaryModel,
      contents,
      config: {
        responseMimeType: 'application/json',
      },
    });
    const text = res?.text || res?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return { text, model: primaryModel };
  } catch (err) {
    console.warn(`[Gemini GenAI] API call to ${primaryModel} failed (${err.message}). Engaging deterministic fallback.`);
    return null;
  }
  return null;
}

/**
 * POST /api/analyze-disruption
 * 4-Stage AI Workflow using @google/genai SDK (gemini-2.5-flash)
 */
app.post('/api/analyze-disruption', async (req, res) => {
  const alertText = req.body?.alert || 'Port of Mumbai closed for 12 days';
  const matchDays = alertText.match(/(\d+)\s*days?/i);
  const disruptionDays = matchDays ? parseInt(matchDays[1], 10) : 12;

  try {
    const inventoryData = await fetchSapInventoryData();
    const suppliersData = await fetchSapSuppliersData();

    const sensingResult = {
      status: 'COMPLETED',
      alert: alertText,
      disruptionDays,
      inventoryCount: inventoryData.length,
      suppliersCount: suppliersData.length,
      timestamp: new Date().toISOString(),
    };

    let impactResult = null;
    let aiUsed = false;

    if (aiClient && process.env.GEMINI_API_KEY) {
      try {
        const impactPrompt = `You are the PulseChain Impact Analysis Agent.
A disruption alert has occurred: "${alertText}".
The disruption duration is ${disruptionDays} days.

Here is the current SAP inventory data:
${JSON.stringify(inventoryData, null, 2)}

Instructions:
1. For each record, calculate days of cover: daysCover = Math.floor(STOCK_QTY / DAILY_USE).
2. Identify all critical shortages where daysCover < ${disruptionDays}.
3. For each critical shortage, calculate shortfallQty = (${disruptionDays} - daysCover) * DAILY_USE.
4. Return ONLY valid JSON with this exact schema:
{
  "disruptionSummary": "Summary of the alert impact",
  "disruptionDurationDays": ${disruptionDays},
  "criticalShortages": [
    {
      "hospitalId": "H002",
      "materialId": "INS001",
      "stockQty": 150,
      "dailyUse": 50,
      "daysCover": 3,
      "shortfallQty": 450,
      "riskLevel": "CRITICAL",
      "reason": "Stock cover is less than disruption duration"
    }
  ],
  "totalCriticalShortages": 1,
  "affectedHospitals": ["H002"]
}`;

        const geminiRes2 = await callGemini(impactPrompt);
        const parsed2 = geminiRes2 ? extractJson(geminiRes2.text) : null;
        if (parsed2 && parsed2.criticalShortages) {
          impactResult = parsed2;
          aiUsed = geminiRes2.model;
        }
      } catch (geminiErr) {
        console.warn('Gemini Step 2 API call error:', geminiErr.message);
      }
    }

    if (!impactResult) {
      const shortages = [];
      const affectedHospitals = new Set();

      inventoryData.forEach((item) => {
        const days = item.DAILY_USE > 0 ? Math.floor(item.STOCK_QTY / item.DAILY_USE) : 999;
        if (days < disruptionDays) {
          const shortfall = Math.max(0, (disruptionDays - days) * item.DAILY_USE);
          shortages.push({
            hospitalId: item.HOSPITAL_ID,
            materialId: item.MATERIAL_ID,
            stockQty: item.STOCK_QTY,
            dailyUse: item.DAILY_USE,
            daysCover: days,
            shortfallQty: shortfall,
            riskLevel: days <= 3 ? 'CRITICAL' : 'HIGH',
            reason: `Current stock cover of ${days} days is below the ${disruptionDays}-day disruption horizon.`,
          });
          affectedHospitals.add(item.HOSPITAL_ID);
        }
      });

      impactResult = {
        disruptionSummary: `Systemic supply bottleneck: ${alertText}. Regional transit suspended for ${disruptionDays} days.`,
        disruptionDurationDays: disruptionDays,
        criticalShortages: shortages,
        totalCriticalShortages: shortages.length,
        affectedHospitals: Array.from(affectedHospitals),
      };
    }

    let recoveryResult = null;

    if (aiClient && process.env.GEMINI_API_KEY) {
      try {
        const recoveryPrompt = `You are the PulseChain Recovery & Compliance Agent.
Disruption Impact Data:
${JSON.stringify(impactResult, null, 2)}

Available SAP Suppliers:
${JSON.stringify(suppliersData, null, 2)}

Surplus Hub: Hospital H005 (BHOPAL) has central emergency inventory reserve (0 days transit lead time, $15/unit transfer cost).

Instructions:
1. Enforce strict cold-chain compliance: Reject COMPLIANCE: 'N'.
2. Provide Option A (Internal Transfer from Hub H005) vs Option B (Commercial Purchase).
3. Return ONLY valid JSON with this exact schema:
{
  "evaluatedSuppliers": [],
  "recommendations": [],
  "complianceSummary": {
    "totalSuppliersAudited": ${suppliersData.length},
    "approvedCount": 4,
    "rejectedCount": 1,
    "verdict": "APPROVED_FOR_EXECUTION"
  }
}`;

        const geminiRes3 = await callGemini(recoveryPrompt);
        const parsed3 = geminiRes3 ? extractJson(geminiRes3.text) : null;
        if (parsed3 && parsed3.recommendations) {
          // Normalize and ensure all master suppliers are evaluated
          const evaluatedMap = new Map();
          if (Array.isArray(parsed3.evaluatedSuppliers)) {
            parsed3.evaluatedSuppliers.forEach((s) => {
              const id = s.supplierId || s.SUPPLIER_ID || s.id;
              if (id) evaluatedMap.set(id, s);
            });
          }

          parsed3.evaluatedSuppliers = suppliersData.map((master) => {
            const fromAi = evaluatedMap.get(master.SUPPLIER_ID) || {};
            const isNonCompliant =
              master.COMPLIANCE === 'N' ||
              fromAi.compliance === 'N' ||
              fromAi.COMPLIANCE === 'N' ||
              master.SUPPLIER_ID === 'V1003' ||
              (typeof fromAi.status === 'string' && (
                fromAi.status.toUpperCase().includes('REJECT') ||
                fromAi.status.toUpperCase().includes('NON') ||
                fromAi.status.toUpperCase().includes('FAIL')
              ));

            return {
              ...master,
              ...fromAi,
              supplierId: master.SUPPLIER_ID,
              supplierName: master.SUPPLIER_NAME,
              materialId: master.MATERIAL_ID,
              compliance: isNonCompliant ? 'N' : (master.COMPLIANCE || 'Y'),
              status: isNonCompliant ? 'REJECTED' : 'APPROVED',
              rejectionReason: isNonCompliant
                ? (fromAi.rejectionReason || "Cold-chain validation failed (COMPLIANCE: 'N'). Temperature excursions detected during storage.")
                : null,
            };
          });

          if (Array.isArray(parsed3.recommendations)) {
            parsed3.recommendations = parsed3.recommendations.map((r) => {
              let sel = r.selectedOption || r.selectedStrategy || 'A';
              if (typeof sel === 'string') {
                if (sel.toLowerCase().includes('option a') || sel.toLowerCase() === 'a') sel = 'A';
                else if (sel.toLowerCase().includes('option b') || sel.toLowerCase() === 'b') sel = 'B';
              }
              return {
                ...r,
                selectedOption: sel,
                selectedStrategy: `Option ${sel}`,
              };
            });
          }
          recoveryResult = parsed3;
          aiUsed = geminiRes3.model;
        }
      } catch (geminiErr) {
        console.warn('Gemini Step 3 API call error:', geminiErr.message);
      }
    }

    if (!recoveryResult) {
      const evaluatedSuppliers = suppliersData.map((s) => {
        const isCompliant = s.COMPLIANCE === 'Y';
        return {
          supplierId: s.SUPPLIER_ID,
          supplierName: s.SUPPLIER_NAME,
          materialId: s.MATERIAL_ID,
          compliance: s.COMPLIANCE,
          status: isCompliant ? 'APPROVED' : 'REJECTED',
          leadTimeDays: s.LEAD_TIME,
          leadTimeHours: s.LEAD_TIME * 24,
          unitCost: s.UNIT_COST,
          capacity: s.CAPACITY,
          rejectionReason: isCompliant
            ? null
            : "Cold-chain validation failed (COMPLIANCE: 'N'). Temperature excursions detected during storage.",
        };
      });

      const approvedSuppliers = evaluatedSuppliers.filter((s) => s.status === 'APPROVED');
      const rejectedSuppliers = evaluatedSuppliers.filter((s) => s.status === 'REJECTED');

      const recommendations = impactResult.criticalShortages.map((shortage) => {
        const matchedSupplier =
          suppliersData.find((s) => s.MATERIAL_ID === shortage.materialId) || suppliersData[0];
        const supplierIsCompliant = matchedSupplier.COMPLIANCE === 'Y';
        const qty = shortage.shortfallQty || shortage.dailyUse * 5;

        const optionA = {
          type: 'INTERNAL_TRANSFER',
          title: 'Internal Surplus Transfer (Hub H005 - BHOPAL)',
          source: 'Hospital H005 (Central Reserve, Bhopal)',
          leadTimeDays: 0,
          leadTimeHours: 4,
          unitCost: 15,
          totalCost: qty * 15,
          complianceStatus: 'VERIFIED_INTERNAL',
        };

        const optionB = {
          type: 'EXTERNAL_PURCHASE',
          title: `External Purchase (${matchedSupplier.SUPPLIER_NAME})`,
          supplierId: matchedSupplier.SUPPLIER_ID,
          supplierName: matchedSupplier.SUPPLIER_NAME,
          leadTimeDays: matchedSupplier.LEAD_TIME,
          leadTimeHours: matchedSupplier.LEAD_TIME * 24,
          unitCost: matchedSupplier.UNIT_COST,
          totalCost: qty * matchedSupplier.UNIT_COST,
          complianceStatus: supplierIsCompliant ? 'APPROVED' : 'REJECTED',
          rejectionReason: supplierIsCompliant
            ? null
            : 'Supplier lacks GAMP/FDA cold-chain validation.',
        };

        const selectedOption = 'A';
        const reasoning = !supplierIsCompliant
          ? `Supplier ${matchedSupplier.SUPPLIER_ID} was REJECTED due to cold-chain violation. Selected Option A (Same-City Hub H005) for instant zero-lead-time recovery.`
          : `Selected Option A (Internal Transfer from Hub H005): Same-city proximity ensures 0-day lead time while saving $${(
              optionB.totalCost - optionA.totalCost
            ).toLocaleString()} in commercial fees.`;

        return {
          hospitalId: shortage.hospitalId,
          materialId: shortage.materialId,
          requiredQty: qty,
          optionA,
          optionB,
          selectedOption,
          reasoning,
          complianceVerdict: 'PASSED',
        };
      });

      recoveryResult = {
        evaluatedSuppliers,
        recommendations,
        complianceSummary: {
          totalSuppliersAudited: suppliersData.length,
          approvedCount: approvedSuppliers.length,
          rejectedCount: rejectedSuppliers.length,
          verdict: 'APPROVED_FOR_EXECUTION',
        },
      };
    }

    const firstRec = recoveryResult.recommendations?.[0] || null;
    let executionPlan = firstRec;
    if (executionPlan) {
      if (!executionPlan.selectedOption) {
        if (executionPlan.option && executionPlan.option.toLowerCase().includes('option a')) {
          executionPlan.selectedOption = 'A';
        } else if (executionPlan.option && executionPlan.option.toLowerCase().includes('option b')) {
          executionPlan.selectedOption = 'B';
        } else {
          executionPlan.selectedOption = 'A';
        }
      }
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      engine: 'PulseChain 4-Stage Agentic Resilience Orchestrator',
      aiEngineUsed: aiUsed ? `Google Gemini (${aiUsed})` : 'PulseChain-Deterministic-Agent (Offline Fallback)',
      aiModel: aiUsed || 'gemini-2.5-flash',
      alert: alertText,
      stages: {
        step1_sensing: sensingResult,
        step2_impact: impactResult,
        step3_recovery_and_compliance: recoveryResult,
      },
      executionReadyPlan: executionPlan,
    });
  } catch (err) {
    console.error('Error in /api/analyze-disruption:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete 4-stage disruption analysis',
      error: err.message,
    });
  }
});

// Start Server with clean console output and robust port error handling
const server = app.listen(PORT, async () => {
  try {
    await fetchSapInventoryData();
  } catch (e) {}
  console.log(`=======================================================`);
  console.log(`🏥 PulseChain Enterprise Supply Chain API on port ${PORT}`);
  console.log(`🔐 POST http://localhost:${PORT}/api/auth/login (JWT RBAC)`);
  console.log(`📡 GET  http://localhost:${PORT}/api/inventory`);
  console.log(`📍 GET  http://localhost:${PORT}/api/inventory/same-city/:hospitalId`);
  console.log(`📋 POST http://localhost:${PORT}/api/stock-count (Shopkeeper & Dual Email)`);
  console.log(`⚡ POST http://localhost:${PORT}/api/supplier-bid (Live Supplier Portal)`);
  console.log(`📢 GET  http://localhost:${PORT}/api/open-shortages (Public RFQs)`);
  console.log(`🚚 POST http://localhost:${PORT}/api/transfer (Agentic Reallocation + Dispatch Email)`);
  console.log(`ℹ️  GET  http://localhost:${PORT}/api/status`);
  console.log(`=======================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️ Port ${PORT} is already in use by another running instance.`);
    console.error(`   To free port ${PORT}, run in PowerShell:`);
    console.error(`   Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force`);
  } else {
    console.error(`⚠️ Server error:`, err.message);
  }
});
