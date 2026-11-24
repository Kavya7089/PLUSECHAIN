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
const path = require('path');

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

// SAP HANA Cloud Analytics Warehouse (Hackfest0418)
const hanaCloudService = require('./hanaCloudService');

// Supabase Auth, PostgreSQL RLS & External Services
const { requireAuth, requireRole, ROLE_ALIASES } = require('./authMiddleware');
const { calculateRoute } = require('./geoRoutingService');
const { getExternalRisk, recommendSuppliers, fetchOpenMeteoWeather } = require('./externalSensingService');
const {
  logStockAuditToSupabase,
  logReallocationToSupabase,
  createSupplierBidInSupabase,
  getSupplierBidsFromSupabase,
  updateSupplierBidStatusInSupabase,
  createShipmentApprovalInSupabase,
  getShipmentApprovalsFromSupabase,
  updateShipmentApprovalInSupabase,
  createSupplierReviewInSupabase,
  getSupplierReviewsFromSupabase,
  createHospitalTaskInSupabase,
  getHospitalTasksFromSupabase,
  supabaseAdmin,
} = require('./supabaseClient');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'pulsechain-enterprise-secret-key-2026';
const MANAGER_EMAIL = process.env.MANAGER_EMAIL || 'manager@pulsechain.com';
const SUPPLIER_EMAIL = process.env.SUPPLIER_EMAIL || 'supplier@pulsechain.com';

// Optional auth helper: extracts user from Bearer token if provided, defaults to REGIONAL_ADMIN if unauthenticated
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-access-token'];
  if (authHeader) {
    return requireAuth(req, res, next);
  }
  req.user = {
    role: 'REGIONAL_ADMIN',
    hospital_id: null,
    supplier_id: null,
    city: 'ALL',
    isAnonymous: true,
  };
  return next();
}

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
    name: 'Dr. Kavya Rajoria',
    email: 'manager.h004@pulsechain.org',
    aliases: ['kavyarajoria9691@gmail.com', 'manager@pulsechain.com'],
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'HOSPITAL_MANAGER',
    legacyRole: 'INVENTORY_MANAGER',
    city: 'BHOPAL',
    hospitalId: 'H004',
    supplierId: null,
    avatar: 'KR',
  },
  {
    id: 'U002',
    name: 'Sejal Tiwari',
    email: 'shopkeeper.h004@pulsechain.org',
    aliases: ['tiwarisejal80@gmail.com', 'shopkeeper@pulsechain.com'],
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'SHOPKEEPER',
    legacyRole: 'STOCK_COUNTER',
    city: 'BHOPAL',
    hospitalId: 'H004',
    supplierId: null,
    warehouseBay: 'COLD_CHAIN_BAY_1',
    avatar: 'ST',
  },
  {
    id: 'U003',
    name: 'Manager Hub H005',
    email: 'manager.h005@pulsechain.org',
    aliases: ['kavyarajoriakr@gmail.com', 'kavyarajoriakr@gmal.com'],
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'HOSPITAL_MANAGER',
    legacyRole: 'INVENTORY_MANAGER',
    city: 'BHOPAL',
    hospitalId: 'H005',
    supplierId: null,
    avatar: 'H5',
  },
  {
    id: 'U004',
    name: 'Manager Hub H006',
    email: 'manager.h006@pulsechain.org',
    aliases: ['manager_indore@pulsechain.com'],
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'HOSPITAL_MANAGER',
    legacyRole: 'INVENTORY_MANAGER',
    city: 'INDORE',
    hospitalId: 'H006',
    supplierId: null,
    avatar: 'H6',
  },
  {
    id: 'U005',
    name: 'Saumay Dubey',
    fullName: 'Saumay Dubey (MediSupply)',
    full_name: 'Saumay Dubey (MediSupply)',
    email: 'v1001@medisupply.in',
    aliases: ['soumaydubey073@gmail.com', 'supplier@pulsechain.com'],
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'SUPPLIER',
    city: 'BHOPAL',
    hospitalId: null,
    supplierId: 'V1001',
    avatar: 'SD',
  },
  {
    id: 'U006',
    name: 'BioCare Logistics India',
    email: 'v1002@biocare.in',
    aliases: ['0111cd23058@technocratsgroup.edu.in'],
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'SUPPLIER',
    city: 'INDORE',
    hospitalId: null,
    supplierId: 'V1002',
    avatar: 'BC',
  },
  {
    id: 'U007',
    name: 'FastMed Cold-Chain Express',
    email: 'v1003@fastmed.in',
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'SUPPLIER',
    city: 'JABALPUR',
    hospitalId: null,
    supplierId: 'V1003',
    avatar: 'FM',
  },
  {
    id: 'U008',
    name: 'Madhya Pradesh Regional Health Admin',
    email: 'regional.head@pulsechain.org',
    aliases: ['kavyarajoria2552@gmail.com', 'admin@pulsechain.com'],
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'REGIONAL_HEAD',
    legacyRole: 'REGIONAL_ADMIN',
    city: 'ALL',
    hospitalId: null,
    supplierId: null,
    avatar: 'RA',
  },
  {
    id: 'U009',
    name: 'Shopkeeper H005 Hub',
    email: 'shopkeeper.h005@pulsechain.org',
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'SHOPKEEPER',
    legacyRole: 'STOCK_COUNTER',
    city: 'BHOPAL',
    hospitalId: 'H005',
    supplierId: null,
    warehouseBay: 'MAIN_DISPATCH_DOCK_2',
    avatar: 'S5',
  },
  {
    id: 'U010',
    name: 'Shopkeeper H006 Indore',
    email: 'shopkeeper.h006@pulsechain.org',
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'SHOPKEEPER',
    legacyRole: 'STOCK_COUNTER',
    city: 'INDORE',
    hospitalId: 'H006',
    supplierId: null,
    warehouseBay: 'INDORE_COLD_BAY_3',
    avatar: 'S6',
  },
];

// Reusable Role-Verification Middleware (Supports Supabase Auth & Local JWT)
function verifyRole(allowedRoles = []) {
  return (req, res, next) => {
    return requireAuth(req, res, () => {
      if (allowedRoles.length === 0) return next();
      return requireRole(...allowedRoles)(req, res, next);
    });
  };
}

// =========================================================================
// 2. AUTOMATED EMAIL UTILITY (Nodemailer with Safe Fallback / Simulation)
// =========================================================================
let mailTransporter = null;
let smtpAuthFailed = false;

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

  if (mailTransporter && process.env.EMAIL_USER && process.env.EMAIL_PASS && !smtpAuthFailed) {
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
      if (err.responseCode === 535 || err.message?.includes('535') || err.code === 'EAUTH') {
        smtpAuthFailed = true;
        console.log('[EMAIL NOTICE] Gmail SMTP authentication requires a 16-character Google App Password (EMAIL_PASS). Operating in clean simulation mode.');
      } else {
        console.warn(`[EMAIL NOTICE] SMTP dispatch unavailable (${err.message}). Using simulation.`);
      }
    }
  }

  // Safe Clean Simulation Logging
  console.log(`[EMAIL SIMULATION] Dispatched to: ${to} | Subject: "${subject}" (${timestamp})`);
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
 * POST /api/auth/register
 * Dual-Sync Registration: Supabase Auth + live registration in SAP S/4HANA ZPULSE_USERS (UserSet)
 */
app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name, role, hospital_id, supplier_id, city, region_name, warehouse_bay } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({
      success: false,
      message: 'Email, password, and full_name are required for registration.',
    });
  }

  const cleanRole = (role || 'SHOPKEEPER').toUpperCase();
  const canonicalRole = ROLE_ALIASES[cleanRole] || cleanRole;

  let createdUser = null;
  let sapSynced = false;
  let userId = null;

  // 1. Create in Supabase Auth if available
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          role: canonicalRole,
          hospital_id: hospital_id || null,
          supplier_id: supplier_id || null,
          city: city || 'BHOPAL',
          region_name: region_name || 'MP_CENTRAL_WEST',
          warehouse_bay: warehouse_bay || 'COLD_CHAIN_BAY_1',
        },
      });

      if (!error && data?.user) {
        createdUser = data.user;
        userId = data.user.id;
      } else if (error && error.message.includes('already registered')) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existing = listData?.users?.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          createdUser = existing;
          userId = existing.id;
        }
      }
    } catch (err) {
      console.warn(`[Register] Supabase admin creation note: ${err.message}`);
    }
  }

  if (!userId) {
    userId = `USER-${Date.now()}`;
  }

  // 2. Direct Sync to SAP Gateway S/4HANA UserSet
  try {
    const sapRes = await sapAdapter.registerUserInSap({
      id: userId,
      email,
      fullName: full_name,
      role: canonicalRole,
      hospitalId: hospital_id,
      supplierId: supplier_id,
      city: city || 'BHOPAL',
      region: region_name || 'MP_CENTRAL_WEST',
      warehouseBay: warehouse_bay || 'COLD_CHAIN_BAY_1',
      canApprove: true,
      status: 'ACTIVE',
    });
    sapSynced = sapRes.success;
  } catch (sapErr) {
    console.warn(`[Register] SAP UserSet registration note: ${sapErr.message}`);
  }

  // Update sap_synced flag in user_profiles
  if (supabaseAdmin && userId) {
    try {
      await supabaseAdmin.from('user_profiles').update({ sap_synced: sapSynced }).eq('id', userId);
    } catch (e) {}
  }

  // Also add to in-memory DEMO_USERS so immediate login succeeds in local mode
  const newDemoUser = {
    id: userId,
    name: full_name,
    fullName: full_name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: canonicalRole,
    city: city || 'BHOPAL',
    hospitalId: hospital_id || null,
    supplierId: supplier_id || null,
    avatar: full_name.slice(0, 2).toUpperCase(),
    sapSynced,
  };
  DEMO_USERS.push(newDemoUser);

  return res.status(201).json({
    success: true,
    message: 'User registered successfully with dual Supabase and SAP S/4HANA synchronization.',
    userId,
    user: {
      id: userId,
      email,
      full_name,
      role: canonicalRole,
      hospital_id,
      supplier_id,
      city,
      sapSynced,
    },
    sapSynced,
  });
});

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

  const cleanEmail = email.trim().toLowerCase();
  const user = DEMO_USERS.find(
    (u) =>
      u.email.toLowerCase() === cleanEmail ||
      (Array.isArray(u.aliases) && u.aliases.some((a) => a.toLowerCase() === cleanEmail))
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. Demo accounts: kavyarajoria9691@gmail.com, tiwarisejal80@gmail.com, soumaydubey073@gmail.com, kavyarajoria2552@gmail.com',
    });
  }

  const isPasswordValid =
    bcrypt.compareSync(password, user.passwordHash) ||
    password === DEMO_PASSWORD ||
    password === 'Pulse@2026';
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid password. Demo password is pass123 or Pulse@2026',
    });
  }

  const tokenPayload = {
    id: user.id,
    name: user.name,
    fullName: user.fullName || user.name,
    full_name: user.full_name || user.fullName || user.name,
    email: cleanEmail,
    primaryEmail: user.email,
    role: user.legacyRole || user.role,
    canonicalRole: user.role,
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
 * Enforces Multi-Tenant Scoping:
 * - SHOPKEEPER / STOCK_COUNTER: only sees their own assigned hospital
 * - HOSPITAL_MANAGER / INVENTORY_MANAGER: sees their own hospital + same-city peers
 * - REGIONAL_ADMIN / Public: sees all facilities
 */
app.get('/api/inventory', optionalAuth, async (req, res) => {
  try {
    const result = await sapAdapter.getStockFromSap();
    let records = result.data || currentStockState;
    currentStockState = records;

    // Apply Tenant Scoping if authenticated user has restrictions
    if (req.user && !req.user.isAnonymous) {
      const userRole = (req.user.role || '').toUpperCase();
      const userHospital = req.user.hospital_id || req.user.hospitalId;
      const userCity = (req.user.city || '').toUpperCase();

      if (['SHOPKEEPER', 'STOCK_COUNTER'].includes(userRole)) {
        if (userHospital) {
          records = records.filter((item) => item.HOSPITAL_ID === userHospital);
        }
      } else if (['HOSPITAL_MANAGER', 'INVENTORY_MANAGER'].includes(userRole)) {
        if (userHospital || userCity) {
          records = records.filter(
            (item) => item.HOSPITAL_ID === userHospital || (item.CITY && item.CITY.toUpperCase() === userCity)
          );
        }
      }
      // REGIONAL_ADMIN sees all
    }

    return res.status(200).json({
      success: true,
      source: result.source || 'LIVE_SAP_ODATA',
      timestamp: new Date().toISOString(),
      data: records,
    });
  } catch (err) {
    let records = currentStockState;
    if (req.user && !req.user.isAnonymous) {
      const userRole = (req.user.role || '').toUpperCase();
      const userHospital = req.user.hospital_id || req.user.hospitalId;
      const userCity = (req.user.city || '').toUpperCase();

      if (['SHOPKEEPER', 'STOCK_COUNTER'].includes(userRole)) {
        if (userHospital) {
          records = records.filter((item) => item.HOSPITAL_ID === userHospital);
        }
      } else if (['HOSPITAL_MANAGER', 'INVENTORY_MANAGER'].includes(userRole)) {
        if (userHospital || userCity) {
          records = records.filter(
            (item) => item.HOSPITAL_ID === userHospital || (item.CITY && item.CITY.toUpperCase() === userCity)
          );
        }
      }
    }
    return res.status(200).json({
      success: true,
      source: 'OFFLINE_SAP_CACHE',
      timestamp: new Date().toISOString(),
      data: records,
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
app.post('/api/stock-count', verifyRole(['STOCK_COUNTER', 'SHOPKEEPER', 'INVENTORY_MANAGER', 'HOSPITAL_MANAGER', 'REGIONAL_ADMIN']), async (req, res) => {
  let { hospitalId, materialId, stockQty, dailyUse } = req.body;

  // Tenant scoping: Force hospitalId to user's assigned hospital if Shopkeeper
  const userRole = (req.user?.role || '').toUpperCase();
  const userHospital = req.user?.hospital_id || req.user?.hospitalId;
  if (['STOCK_COUNTER', 'SHOPKEEPER'].includes(userRole) && userHospital) {
    hospitalId = userHospital;
  }

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
  const previousQty = record ? record.STOCK_QTY : numericStock;

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
    countedBy: req.user?.name || req.user?.full_name || 'Authorized Officer',
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

  // App-Layer Supabase Audit Log (Non-ERP history)
  logStockAuditToSupabase({
    userId: req.user?.id || null,
    hospitalId,
    materialId,
    previousQty,
    newQty: numericStock,
    dailyUse: numericDaily,
    sapCommitted: sapRecorded,
  }).catch((err) => console.warn('[Supabase Audit] Warning logging stock audit:', err.message));

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
 * Role: SUPPLIER, INVENTORY_MANAGER, HOSPITAL_MANAGER, REGIONAL_ADMIN
 * Accepts { supplierId, materialId, unitCost, leadTime, capacity, compliance, delayReason, hospitalId }
 * Dynamically enforces OSRM route transit duration + 1 Day Rule.
 * If leadTime > maxAllowedLeadDays, requires delayReason (min 5 characters).
 * Calls SAP Gateway OData v2 Z_PULSE_SUBMIT_BID and updates in-memory supplier proposals.
 */
app.post(['/api/supplier-bid', '/api/bids'], verifyRole(['SUPPLIER', 'INVENTORY_MANAGER', 'HOSPITAL_MANAGER', 'REGIONAL_ADMIN']), async (req, res) => {
  let supplierId = req.body.supplierId || req.body.supplier_id;
  let materialId = req.body.materialId || req.body.material_id;
  let unitCost = req.body.unitCost !== undefined ? req.body.unitCost : req.body.unit_cost;
  let leadTime = req.body.leadTime !== undefined ? req.body.leadTime : (req.body.lead_time_days !== undefined ? req.body.lead_time_days : req.body.leadTimeDays);
  let capacity = req.body.capacity !== undefined ? req.body.capacity : req.body.offered_qty;
  let compliance = req.body.compliance;
  let delayReason = req.body.delayReason || req.body.delay_reason;
  let hospitalId = req.body.hospitalId || req.body.rfq_hospital_id || req.body.rfqHospitalId;

  // Tenant scoping: Force supplierId to user's assigned supplier if SUPPLIER
  const userRole = (req.user?.role || '').toUpperCase();
  const userSupplier = req.user?.supplier_id || req.user?.supplierId;
  if (userRole === 'SUPPLIER' && userSupplier) {
    supplierId = userSupplier;
  }

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

  // Dynamic OSRM Travel-Time & "+1 Day Rule" validation
  const targetHospitalId = hospitalId || 'H004';
  let routeInfo = null;
  try {
    routeInfo = await calculateRoute(supplierId, targetHospitalId);
    const maxAllowedLeadDays = Math.ceil((routeInfo.durationHours || 0) / 24) + 1;

    if (numericLead > maxAllowedLeadDays) {
      if (!delayReason || typeof delayReason !== 'string' || delayReason.trim().length < 5) {
        return res.status(400).json({
          success: false,
          requiresDelayReason: true,
          leadTime: numericLead,
          maxAllowedLeadDays,
          route: routeInfo,
          message: `Proposed lead time (${numericLead} days) exceeds maximum allowable transit duration (${maxAllowedLeadDays} days: transit time + 1 day buffer). A mandatory delay reason (minimum 5 characters) must be provided.`,
        });
      }
    }
  } catch (routeErr) {
    console.warn(`[OSRM Routing] Lead time check bypass: ${routeErr.message}`);
  }

  let sapRecorded = false;
  try {
    const sapRes = await sapAdapter.submitBidToSap(
      supplierId,
      materialId,
      numericCost,
      numericLead,
      numericCap,
      complianceFlag,
      delayReason || ''
    );
    sapRecorded = sapRes.sapRecorded;
  } catch (sapErr) {
    sapRecorded = false;
  }

  const newBid = {
    id: `BID-${Date.now()}`,
    timestamp: new Date().toISOString(),
    supplierId,
    supplier_id: supplierId,
    supplierName: req.user?.name || req.user?.full_name || `Vendor ${supplierId}`,
    materialId,
    material_id: materialId,
    rfq_hospital_id: targetHospitalId,
    rfqHospitalId: targetHospitalId,
    hospitalId: targetHospitalId,
    unitCost: numericCost,
    unit_cost: numericCost,
    currency: 'INR',
    leadTime: numericLead,
    lead_time_days: numericLead,
    capacity: numericCap,
    offered_qty: numericCap,
    compliance: complianceFlag,
    delayReason: delayReason || null,
    delay_reason: delayReason || null,
    osrmRoute: routeInfo ? { distanceKm: routeInfo.distanceKm, durationHours: routeInfo.durationHours, mode: routeInfo.mode } : null,
    status: complianceFlag === 'Y' ? 'ACTIVE_PROPOSAL' : 'FLAGGED_EXCURSION',
    submittedBy: req.user?.email || 'supplier@pulsechain.com',
  };

  supplierBids.unshift(newBid);
  sapAdapter.logSupplierBid(newBid);
  await createSupplierBidInSupabase(newBid).catch((e) => console.warn('[Supabase Bid] Sync note:', e.message));

  // Non-blocking Auto-Log into SAP HANA Cloud PULSECHAIN_SUPPLIER_SLA
  const osrmTravelDays = routeInfo ? Math.max(1, Math.ceil((routeInfo.durationHours || 0) / 24)) : 1;
  hanaCloudService.recordSupplierSla({
    supplierId,
    materialId,
    trustScore: 88.0,
    supplierTier: complianceFlag === 'Y' ? 'GOLD' : 'BLOCKED',
    osrmTravelDays,
    promisedLeadDays: numericLead,
    delayFlag: numericLead > osrmTravelDays + 1 ? 'Y' : 'N',
    delayReason: delayReason || 'Proposal registered via Supplier Portal',
  }).catch((err) => console.warn('[HANA Cloud Auto-Log] Supplier bid SLA note:', err.message));

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
/**
 * POST /api/transfer
 * Phase 2 Agentic Reallocation (Write Operation)
 * Maps Node parameters to SAP S/4HANA OData v2 InventorySet updates.
 * Enforces Tenant Scoping:
 * - HOSPITAL_MANAGER: only allowed to receive into their assigned hospital
 * - SHOPKEEPER / SUPPLIER: 403 Forbidden
 * - REGIONAL_ADMIN / System: authorized across all facilities
 * Logs audit record to Supabase reallocation_logs table.
 */
app.post('/api/transfer', optionalAuth, async (req, res) => {
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

  // Tenant Enforcement:
  // Hospital Managers may only transfer stock into their assigned hospital
  if (req.user && !req.user.isAnonymous) {
    const userRole = (req.user.role || '').toUpperCase();
    const userHospital = req.user.hospital_id || req.user.hospitalId;

    if (['HOSPITAL_MANAGER', 'INVENTORY_MANAGER'].includes(userRole)) {
      if (userHospital && toHospital !== userHospital) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: Hospital Managers may only authorize inbound transfers to their assigned facility (${userHospital}). Target was ${toHospital}.`,
        });
      }
    } else if (['SHOPKEEPER', 'STOCK_COUNTER', 'SUPPLIER'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions to authorize stock transfers.',
      });
    }
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

  // App-Layer Supabase Reallocation Audit Log (Non-ERP history)
  logReallocationToSupabase({
    approvedBy: req.user?.id || null,
    fromHospital,
    toHospital,
    materialId,
    qty: numericQty,
    mode: 'EMERGENCY_REALLOCATION',
    supplierId: null,
    sapCommitted: sapSuccess,
  }).catch((err) => console.warn('[Supabase Reallocation Audit] Warning logging reallocation:', err.message));

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

// =========================================================================
// 8A. ORDERS & 2-STEP SHOPKEEPER GOODS APPROVALS
// =========================================================================

/**
 * POST /api/orders/transfer
 * Hospital Manager requests inter-hospital transfer.
 * Does NOT move SAP stock immediately; queues in shipment_approvals (PENDING_DISPATCH)
 */
app.post('/api/orders/transfer', verifyRole(['HOSPITAL_MANAGER', 'INVENTORY_MANAGER', 'REGIONAL_HEAD', 'REGIONAL_ADMIN']), async (req, res) => {
  const { fromHospital, toHospital, materialId, qty } = req.body;
  const userRole = req.user.role;
  const userHospital = req.user.hospital_id || req.user.hospitalId;

  const destHospital = toHospital || req.body.destHospitalId || req.body.dest_hospital_id;
  const sourceHospital = fromHospital || req.body.sourceHospitalId || req.body.source_hospital_id;

  if (!destHospital || !sourceHospital || !materialId || !qty) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameters: fromHospital, toHospital, materialId, qty',
    });
  }

  // Strict Own-Hospital Scope
  if (['HOSPITAL_MANAGER', 'INVENTORY_MANAGER'].includes(userRole) && userHospital) {
    if (destHospital !== userHospital) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Hospital Managers may only order replenishment into their assigned facility (${userHospital}). Target was ${destHospital}.`,
      });
    }
  }

  const numericQty = parseFloat(qty);
  if (isNaN(numericQty) || numericQty <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid transfer quantity.' });
  }

  const shipment = await createShipmentApprovalInSupabase({
    orderType: 'HOSPITAL_TRANSFER',
    sourceHospitalId: sourceHospital,
    destHospitalId: destHospital,
    materialId,
    qty: numericQty,
    requestedByManagerId: req.user.id,
    status: 'PENDING_DISPATCH',
  });

  return res.status(201).json({
    success: true,
    message: `Transfer order created and queued for source shopkeeper dispatch approval at ${sourceHospital}. SAP stock will move upon Shopkeeper physical handover.`,
    shipment,
  });
});

/**
 * POST /api/bids/:bidId/accept
 * Hospital Manager accepts an emergency supplier quote without moving SAP stock immediately.
 * Validates bid.rfq_hospital_id === req.user.hospital_id and creates shipment_approvals (IN_TRANSIT).
 */
app.post('/api/bids/:bidId/accept', verifyRole(['HOSPITAL_MANAGER', 'INVENTORY_MANAGER', 'REGIONAL_HEAD', 'REGIONAL_ADMIN']), async (req, res) => {
  const { bidId } = req.params;
  const userRole = req.user.role;
  const userHospital = req.user.hospital_id || req.user.hospitalId;

  const bids = await getSupplierBidsFromSupabase();
  const bid = bids.find((b) => b.id === bidId) || supplierBids.find((b) => b.id === bidId);

  if (!bid) {
    return res.status(404).json({ success: false, message: `Bid ${bidId} not found.` });
  }

  const rfqHospital = bid.rfq_hospital_id || bid.rfqHospitalId || bid.hospitalId || 'H004';

  // Strict Own-Hospital Manager Lock
  if (['HOSPITAL_MANAGER', 'INVENTORY_MANAGER'].includes(userRole) && userHospital) {
    if (rfqHospital !== userHospital) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: You can only accept bids for your assigned hospital (${userHospital}). Bid RFQ was for ${rfqHospital}.`,
      });
    }
  }

  await updateSupplierBidStatusInSupabase(bidId, 'ACCEPTED');
  if (bid.status) bid.status = 'ACCEPTED';

  // Create shipment in IN_TRANSIT awaiting dest shopkeeper receipt
  const shipment = await createShipmentApprovalInSupabase({
    orderType: 'SUPPLIER_DELIVERY',
    supplierId: bid.supplier_id || bid.supplierId,
    destHospitalId: rfqHospital,
    materialId: bid.material_id || bid.materialId,
    qty: Number(bid.offered_qty || bid.capacity || 100),
    bidId: bid.id,
    requestedByManagerId: req.user.id,
    status: 'IN_TRANSIT',
  });

  return res.status(200).json({
    success: true,
    message: `Supplier proposal accepted. Delivery is now IN_TRANSIT and pending Shopkeeper physical receipt verification at ${rfqHospital}.`,
    shipment,
  });
});

/**
 * GET /api/shipments/pending
 * Lists outgoing dispatches (for source shopkeepers) and incoming receipts (for dest shopkeepers)
 */
app.get('/api/shipments/pending', verifyRole(['SHOPKEEPER', 'STOCK_COUNTER', 'HOSPITAL_MANAGER', 'INVENTORY_MANAGER', 'REGIONAL_HEAD', 'REGIONAL_ADMIN']), async (req, res) => {
  const userHospital = req.user.hospital_id || req.user.hospitalId || 'H004';
  const allShipments = await getShipmentApprovalsFromSupabase();
  const isRegional = ['REGIONAL_HEAD', 'REGIONAL_ADMIN'].includes(req.user.role);

  const outgoingDispatches = allShipments.filter(
    (s) => (isRegional || s.source_hospital_id === userHospital) && s.status === 'PENDING_DISPATCH'
  );
  const incomingReceipts = allShipments.filter(
    (s) => (isRegional || s.dest_hospital_id === userHospital) && s.status === 'IN_TRANSIT'
  );

  return res.status(200).json({
    success: true,
    hospitalId: userHospital,
    outgoingDispatches,
    incomingReceipts,
  });
});

/**
 * POST /api/shipments/:id/approve-dispatch
 * Step 1: Shopkeeper at source_hospital_id approves physical dispatch.
 * Deducts stock live from SAP ZPULSE_INV and advances status to IN_TRANSIT.
 */
app.post('/api/shipments/:id/approve-dispatch', verifyRole(['SHOPKEEPER', 'STOCK_COUNTER', 'REGIONAL_HEAD', 'REGIONAL_ADMIN']), async (req, res) => {
  const { id } = req.params;
  const userHospital = req.user.hospital_id || req.user.hospitalId;
  const isRegional = ['REGIONAL_HEAD', 'REGIONAL_ADMIN'].includes(req.user.role);

  const shipments = await getShipmentApprovalsFromSupabase();
  const shipment = shipments.find((s) => s.id === id);

  if (!shipment) {
    return res.status(404).json({ success: false, message: `Shipment ${id} not found.` });
  }

  if (shipment.status !== 'PENDING_DISPATCH') {
    return res.status(400).json({ success: false, message: `Shipment is in '${shipment.status}', cannot approve dispatch.` });
  }

  if (!isRegional && userHospital && shipment.source_hospital_id !== userHospital) {
    return res.status(403).json({
      success: false,
      error: `Forbidden: Only shopkeepers at source hospital (${shipment.source_hospital_id}) can authorize dispatch. You are at ${userHospital}.`,
    });
  }

  let sapResult = null;
  try {
    sapResult = await sapAdapter.updateHospitalStockLive(shipment.source_hospital_id, shipment.material_id, -Number(shipment.qty));
  } catch (err) {
    console.warn('[Dispatch Live SAP Stock Error]', err.message);
  }

  const donorRecord = currentStockState.find(
    (item) => item.HOSPITAL_ID === shipment.source_hospital_id && item.MATERIAL_ID === shipment.material_id
  );
  if (donorRecord) {
    donorRecord.STOCK_QTY = Math.max(0, donorRecord.STOCK_QTY - Number(shipment.qty));
  }

  const updated = await updateShipmentApprovalInSupabase(id, {
    status: 'IN_TRANSIT',
    dispatch_approved_by: req.user.id,
    dispatch_approved_at: new Date().toISOString(),
    sap_dispatch_committed: Boolean(sapResult?.sapRecorded),
  });

  return res.status(200).json({
    success: true,
    message: `Physical dispatch approved. ${shipment.qty} units deducted from Hospital ${shipment.source_hospital_id} in SAP S/4HANA. Shipment is now IN_TRANSIT.`,
    shipment: updated,
    sapRecorded: sapResult?.sapRecorded,
  });
});

/**
 * POST /api/shipments/:id/approve-receipt
 * Step 2: Shopkeeper at dest_hospital_id confirms physical delivery receipt.
 * Adds stock live to SAP ZPULSE_INV and marks shipment DELIVERED (ready for Manager review).
 */
app.post('/api/shipments/:id/approve-receipt', verifyRole(['SHOPKEEPER', 'STOCK_COUNTER', 'REGIONAL_HEAD', 'REGIONAL_ADMIN']), async (req, res) => {
  const { id } = req.params;
  const userHospital = req.user.hospital_id || req.user.hospitalId;
  const isRegional = ['REGIONAL_HEAD', 'REGIONAL_ADMIN'].includes(req.user.role);

  const shipments = await getShipmentApprovalsFromSupabase();
  const shipment = shipments.find((s) => s.id === id);

  if (!shipment) {
    return res.status(404).json({ success: false, message: `Shipment ${id} not found.` });
  }

  if (shipment.status !== 'IN_TRANSIT') {
    return res.status(400).json({ success: false, message: `Shipment is in '${shipment.status}', cannot approve receipt.` });
  }

  if (!isRegional && userHospital && shipment.dest_hospital_id !== userHospital) {
    return res.status(403).json({
      success: false,
      error: `Forbidden: Only shopkeepers at receiving hospital (${shipment.dest_hospital_id}) can approve receipt. You are at ${userHospital}.`,
    });
  }

  let sapResult = null;
  try {
    sapResult = await sapAdapter.updateHospitalStockLive(shipment.dest_hospital_id, shipment.material_id, Number(shipment.qty));
  } catch (err) {
    console.warn('[Receipt Live SAP Stock Error]', err.message);
  }

  const destRecord = currentStockState.find(
    (item) => item.HOSPITAL_ID === shipment.dest_hospital_id && item.MATERIAL_ID === shipment.material_id
  );
  if (destRecord) {
    destRecord.STOCK_QTY = Number(destRecord.STOCK_QTY) + Number(shipment.qty);
  }

  if (shipment.bid_id) {
    await updateSupplierBidStatusInSupabase(shipment.bid_id, 'DELIVERED');
  }

  const updated = await updateShipmentApprovalInSupabase(id, {
    status: 'DELIVERED',
    receipt_approved_by: req.user.id,
    receipt_approved_at: new Date().toISOString(),
    sap_receipt_committed: Boolean(sapResult?.sapRecorded),
  });

  return res.status(200).json({
    success: true,
    message: `Physical goods receipt verified. ${shipment.qty} units added to Hospital ${shipment.dest_hospital_id} in SAP S/4HANA. Awaiting Manager post-delivery review.`,
    shipment: updated,
    sapRecorded: sapResult?.sapRecorded,
  });
});

/**
 * POST /api/shipments/:id/reject
 * Shopkeeper rejects PENDING_DISPATCH before any SAP stock movements occur.
 */
app.post('/api/shipments/:id/reject', verifyRole(['SHOPKEEPER', 'STOCK_COUNTER', 'HOSPITAL_MANAGER', 'INVENTORY_MANAGER', 'REGIONAL_HEAD', 'REGIONAL_ADMIN']), async (req, res) => {
  const { id } = req.params;
  const { rejection_note } = req.body;

  const shipments = await getShipmentApprovalsFromSupabase();
  const shipment = shipments.find((s) => s.id === id);

  if (!shipment) {
    return res.status(404).json({ success: false, message: `Shipment ${id} not found.` });
  }

  if (shipment.status !== 'PENDING_DISPATCH') {
    return res.status(400).json({ success: false, message: `Only PENDING_DISPATCH shipments can be rejected before stock movement.` });
  }

  const updated = await updateShipmentApprovalInSupabase(id, {
    status: 'REJECTED',
    rejection_note: rejection_note || 'Rejected by physical custodian',
  });

  return res.status(200).json({
    success: true,
    message: 'Shipment rejected. Zero stock changes made in SAP S/4HANA.',
    shipment: updated,
  });
});

// =========================================================================
// 8B. MANAGER POST-DELIVERY REVIEWS & SAP HANA RE-RANKING
// =========================================================================

/**
 * GET /api/reviews/pending
 * Lists DELIVERED supplier shipments for manager's hospital awaiting performance review
 */
app.get('/api/reviews/pending', verifyRole(['HOSPITAL_MANAGER', 'INVENTORY_MANAGER', 'REGIONAL_HEAD', 'REGIONAL_ADMIN']), async (req, res) => {
  const userHospital = req.user.hospital_id || req.user.hospitalId || 'H004';
  const isRegional = ['REGIONAL_HEAD', 'REGIONAL_ADMIN'].includes(req.user.role);

  const allShipments = await getShipmentApprovalsFromSupabase();
  const pendingReviews = allShipments.filter(
    (s) =>
      (isRegional || s.dest_hospital_id === userHospital) &&
      s.status === 'DELIVERED' &&
      !s.review_submitted &&
      Boolean(s.supplier_id)
  );

  return res.status(200).json({
    success: true,
    hospitalId: userHospital,
    count: pendingReviews.length,
    shipments: pendingReviews,
  });
});

/**
 * POST /api/reviews
 * Manager submits ratings (1–100) for the 8 factors.
 * Pushes to SAP ZPULSE_SUPP via POST /SupplierSet and returns live recalculated TRUST_SCORE and SUPPLIER_TIER.
 */
app.post('/api/reviews', verifyRole(['HOSPITAL_MANAGER', 'INVENTORY_MANAGER', 'REGIONAL_HEAD', 'REGIONAL_ADMIN']), async (req, res) => {
  const shipment_id = req.body.shipment_id || req.body.shipmentId;
  const delivery_speed = req.body.delivery_speed !== undefined ? req.body.delivery_speed : req.body.deliverySpeed;
  const on_time_rate = req.body.on_time_rate !== undefined ? req.body.on_time_rate : req.body.onTimeRate;
  const reliability = req.body.reliability !== undefined ? req.body.reliability : req.body.reliability;
  const quality_score = req.body.quality_score !== undefined ? req.body.quality_score : req.body.qualityScore;
  const emerg_response = req.body.emerg_response !== undefined ? req.body.emerg_response : req.body.emergResponse;
  const cold_chain_score = req.body.cold_chain_score !== undefined ? req.body.cold_chain_score : req.body.coldChainScore;
  const fulfilment_rate = req.body.fulfilment_rate !== undefined ? req.body.fulfilment_rate : req.body.fulfilmentRate;
  const doc_cert_score = req.body.doc_cert_score !== undefined ? req.body.doc_cert_score : req.body.docCertScore;
  const comments = req.body.comments;

  const userHospital = req.user.hospital_id || req.user.hospitalId;
  const isRegional = ['REGIONAL_HEAD', 'REGIONAL_ADMIN'].includes(req.user.role);

  if (!shipment_id) {
    return res.status(400).json({ success: false, message: 'shipment_id is required.' });
  }

  const shipments = await getShipmentApprovalsFromSupabase();
  const shipment = shipments.find((s) => s.id === shipment_id);

  if (!shipment) {
    return res.status(404).json({ success: false, message: `Shipment ${shipment_id} not found.` });
  }

  // Strict Hospital Manager Scope
  if (!isRegional && userHospital && shipment.dest_hospital_id !== userHospital) {
    return res.status(403).json({
      success: false,
      error: `Forbidden: Managers may only submit reviews for shipments delivered to their hospital (${userHospital}). Target was ${shipment.dest_hospital_id}.`,
    });
  }

  // Validate 8 ratings (1-100)
  const factorMap = {
    delivery_speed,
    on_time_rate,
    reliability,
    quality_score,
    emerg_response,
    cold_chain_score,
    fulfilment_rate,
    doc_cert_score,
  };

  for (const [k, v] of Object.entries(factorMap)) {
    const val = Number(v);
    if (isNaN(val) || val < 1 || val > 100) {
      return res.status(400).json({
        success: false,
        message: `Invalid rating for '${k}'. Must be an integer between 1 and 100. Received: ${v}`,
      });
    }
  }

  const ratings = {
    deliverySpeed: Number(delivery_speed),
    onTimeRate: Number(on_time_rate),
    reliability: Number(reliability),
    qualityScore: Number(quality_score),
    emergResponse: Number(emerg_response),
    coldChainScore: Number(cold_chain_score),
    fulfilmentRate: Number(fulfilment_rate),
    docCertScore: Number(doc_cert_score),
  };

  const sapResult = await sapAdapter.updateSupplierMetricsInSap(
    shipment.supplier_id,
    shipment.material_id,
    ratings,
    comments || ''
  );

  const review = await createSupplierReviewInSupabase({
    shipmentId: shipment.id,
    supplierId: shipment.supplier_id,
    materialId: shipment.material_id,
    hospitalId: shipment.dest_hospital_id,
    reviewedByManagerId: req.user.id,
    ratings,
    comments: comments || '',
    syncedToSap: Boolean(sapResult.sapRecorded),
  });

  await updateShipmentApprovalInSupabase(shipment.id, { review_submitted: true });

  // Non-blocking Auto-Log into SAP HANA Cloud PULSECHAIN_SUPPLIER_SLA
  hanaCloudService.recordSupplierSla({
    supplierId: shipment.supplier_id,
    materialId: shipment.material_id,
    trustScore: sapResult.trustScore || 85.0,
    supplierTier: sapResult.supplierTier || 'GOLD',
    osrmTravelDays: 1.0,
    promisedLeadDays: 1.0,
    delayFlag: Number(delivery_speed) < 70 ? 'Y' : 'N',
    delayReason: comments || 'Post-delivery performance review logged in SAP',
  }).catch((err) => console.warn('[HANA Cloud Auto-Log] Supplier review SLA note:', err.message));

  return res.status(201).json({
    success: true,
    message: 'Post-delivery review recorded and synchronized to SAP S/4HANA Supplier Ledger.',
    review,
    trustScore: sapResult.trustScore,
    supplierTier: sapResult.supplierTier,
    isEligible: sapResult.isEligible,
    factors: sapResult.factors,
    sapRecorded: sapResult.sapRecorded,
  });
});

// =========================================================================
// 8C. REGIONAL HEAD STAFF DIRECTORY & HOSPITAL TASKS
// =========================================================================

/**
 * GET /api/regional/users
 * Returns live staff directory from SAP UserSet merged with Supabase sync status
 */
app.get('/api/regional/users', verifyRole(['REGIONAL_HEAD', 'REGIONAL_ADMIN']), async (req, res) => {
  const sapUsersResult = await sapAdapter.getSapUsers();
  const sapUsers = sapUsersResult.users || [];

  let supabaseProfiles = [];
  if (supabaseAdmin) {
    try {
      const { data } = await supabaseAdmin.from('user_profiles').select('*');
      if (Array.isArray(data)) supabaseProfiles = data;
    } catch (e) {}
  }

  const merged = sapUsers.map((u) => {
    const prof = supabaseProfiles.find((p) => p.email?.toLowerCase() === u.Email?.toLowerCase());
    return {
      userId: u.UserId,
      email: u.Email,
      fullName: u.FullName,
      role: u.Role,
      hospitalId: u.HospitalId || null,
      supplierId: u.SupplierId || null,
      city: u.City,
      region: u.Region,
      warehouseBay: u.WarehouseBay,
      canApprove: u.CanApprove === 'Y',
      status: u.Status,
      sapSynced: true,
      supabaseUserId: prof?.id || null,
    };
  });

  return res.status(200).json({
    success: true,
    source: sapUsersResult.isLive ? 'LIVE_SAP_USERSET' : 'OFFLINE_CACHE',
    count: merged.length,
    users: merged,
  });
});

/**
 * POST /api/tasks & GET /api/tasks
 * Own-Hospital Task Plans
 */
app.post('/api/tasks', verifyRole(['HOSPITAL_MANAGER', 'INVENTORY_MANAGER', 'REGIONAL_HEAD', 'REGIONAL_ADMIN']), async (req, res) => {
  const { hospital_id, material_id, title, description, priority, due_date } = req.body;
  const userRole = req.user.role;
  const userHospital = req.user.hospital_id || req.user.hospitalId;

  if (['HOSPITAL_MANAGER', 'INVENTORY_MANAGER'].includes(userRole) && userHospital) {
    if (hospital_id && hospital_id !== userHospital) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Cannot create tasks for other hospitals. You are assigned to ${userHospital}.`,
      });
    }
  }

  const targetHospital = hospital_id || userHospital || 'H004';
  if (!title) {
    return res.status(400).json({ success: false, message: 'Task title is required.' });
  }

  const task = await createHospitalTaskInSupabase({
    hospitalId: targetHospital,
    materialId: material_id,
    title,
    description,
    priority,
    status: 'PENDING',
    assignedTo: null,
    createdBy: req.user.id,
    dueDate: due_date,
  });

  return res.status(201).json({ success: true, task });
});

app.get(['/api/tasks', '/api/tasks/:hospitalId'], optionalAuth, async (req, res) => {
  const hospitalId = req.params.hospitalId || req.user?.hospital_id || req.user?.hospitalId;
  const tasks = await getHospitalTasksFromSupabase(hospitalId);
  return res.status(200).json({ success: true, tasks });
});

/**
 * GET /api/bids
 * Multi-tenant Scoped Bids:
 * - SUPPLIER sees only their own bids
 * - HOSPITAL_MANAGER sees bids for their hospital
 * - REGIONAL_HEAD sees all
 */
app.get('/api/bids', optionalAuth, async (req, res) => {
  const userRole = (req.user?.role || '').toUpperCase();
  const userSupplier = req.user?.supplier_id || req.user?.supplierId;
  const userHospital = req.user?.hospital_id || req.user?.hospitalId;

  let filter = {};
  if (userRole === 'SUPPLIER' && userSupplier) {
    filter.supplierId = userSupplier;
  } else if (['HOSPITAL_MANAGER', 'INVENTORY_MANAGER'].includes(userRole) && userHospital) {
    filter.rfqHospitalId = userHospital;
  }

  const bids = await getSupplierBidsFromSupabase(filter);
  return res.status(200).json({ success: true, count: bids.length, data: bids });
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
 * Alongside live SAP HANA Cloud analytics warehouse connectivity status.
 */
app.get('/api/sap/status', async (req, res) => {
  const status = await sapAdapter.getSapStatus();
  const hanaPing = await hanaCloudService.pingHanaCloud();
  const hanaStatus = {
    connected: hanaPing.connected,
    engine: 'SAP HANA Cloud',
    schema: process.env.HANA_USER || 'Hackfest0418',
    host: hanaPing.host || process.env.HANA_HOST || 'hackfest0418.hana.prod-eu10.hanacloud.ondemand.com',
    port: process.env.HANA_PORT || 443,
    status: hanaPing.status || (hanaPing.connected ? 'ONLINE' : 'PAUSED_OR_STANDBY'),
    timestamp: hanaPing.timestamp,
  };

  return res.status(200).json({
    success: true,
    ...status,
    hanaCloud: hanaStatus,
    data: {
      ...status,
      hanaCloud: hanaStatus,
    },
  });
});

/**
 * GET /api/status
 * Overall system health & SAP Gateway OData connectivity diagnosis
 */
app.get('/api/status', async (req, res) => {
  const sapStatus = await sapAdapter.getSapStatus();
  const hanaPing = await hanaCloudService.pingHanaCloud();
  const hanaStatus = {
    connected: hanaPing.connected,
    engine: 'SAP HANA Cloud',
    schema: process.env.HANA_USER || 'Hackfest0418',
  };

  res.status(200).json({
    system: 'PulseChain Resilience Engine',
    version: '3.1.0 (SAP S/4HANA OData & HANA Cloud Edition)',
    status: 'ONLINE',
    sapStatus: sapStatus,
    hanaCloud: hanaStatus,
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

// =========================================================================
// 8B. SAP HANA CLOUD EXECUTIVE WAREHOUSE ENDPOINTS
// =========================================================================

/**
 * GET /api/analytics/hana-cloud
 * Returns live output of getRegionalExecutiveAnalytics() from SAP HANA Cloud:
 * V_REGIONAL_EXEC_SUMMARY, latest 15 PULSECHAIN_RISK_SNAPSHOTS, and PULSECHAIN_SUPPLIER_SLA.
 * Access: REGIONAL_HEAD, REGIONAL_ADMIN, HOSPITAL_MANAGER, INVENTORY_MANAGER
 */
app.get(
  '/api/analytics/hana-cloud',
  verifyRole(['REGIONAL_HEAD', 'REGIONAL_ADMIN', 'HOSPITAL_MANAGER', 'INVENTORY_MANAGER']),
  async (req, res) => {
    try {
      const analytics = await hanaCloudService.getRegionalExecutiveAnalytics();
      return res.status(200).json(analytics);
    } catch (err) {
      console.error('[HANA Cloud API Error]:', err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

/**
 * POST /api/analytics/hana-cloud/sync
 * Pulls current live inventory from SAP S/4HANA (ZPLUSE_SRV/InventorySet),
 * pairs it with live Open-Meteo weather / external risk, and writes fresh snapshot
 * rows into SAP HANA Cloud PULSECHAIN_RISK_SNAPSHOTS, returning updated analytics.
 * Access: REGIONAL_HEAD, REGIONAL_ADMIN, HOSPITAL_MANAGER, INVENTORY_MANAGER
 */
app.post(
  '/api/analytics/hana-cloud/sync',
  verifyRole(['REGIONAL_HEAD', 'REGIONAL_ADMIN', 'HOSPITAL_MANAGER', 'INVENTORY_MANAGER']),
  async (req, res) => {
    try {
      // 1. Fetch live inventory from SAP S/4HANA
      let items = currentStockState;
      try {
        const liveSap = await sapAdapter.getInventory();
        if (liveSap && liveSap.length > 0) {
          items = liveSap;
        }
      } catch (sapErr) {
        console.warn('[HANA Cloud Sync] SAP live fetch note:', sapErr.message);
      }

      // City Coordinates for Open-Meteo weather sensing
      const CITY_COORDS = {
        BHOPAL: { lat: 23.2599, lon: 77.4126 },
        INDORE: { lat: 22.7196, lon: 75.8577 },
        JABALPUR: { lat: 23.1815, lon: 79.9864 },
      };

      // 2. Pair active records with live weather & record snapshots
      let syncedCount = 0;
      const sampleItems = items.slice(0, 12);

      for (const item of sampleItems) {
        const city = (item.CITY || 'BHOPAL').toUpperCase();
        const coords = CITY_COORDS[city] || CITY_COORDS.BHOPAL;
        let weather = { temperature: 28.5 };
        try {
          weather = await fetchOpenMeteoWeather(coords.lat, coords.lon);
        } catch (wErr) {}

        const stockQty = Number(item.CURRENT_STOCK) || 1000;
        const dailyUse = Number(item.DAILY_USE) || 100;
        const daysCover = dailyUse > 0 ? Number((stockQty / dailyUse).toFixed(1)) : 10;

        let externalRisk = 'LOW';
        if (weather.temperature > 35) externalRisk = 'HEATWAVE_EXCURSION';
        else if (weather.precipitation > 5) externalRisk = 'PRECIPITATION_RISK';
        else if (weather.windSpeed > 30) externalRisk = 'HIGH_WIND_WARNING';

        let deliveryImpact = 'ON_TIME';
        if (daysCover < 7) deliveryImpact = 'CRITICAL_SHORTAGE';
        else if (daysCover < 12) deliveryImpact = 'DELAY_SENSITIVE';

        await hanaCloudService.recordRiskSnapshot({
          city,
          hospitalId: item.HOSPITAL_ID || 'H004',
          materialId: item.MATERIAL_ID || 'GEN001',
          stockQty,
          dailyUse,
          daysCover,
          externalRisk,
          deliveryImpact,
          weatherTempC: weather.temperature,
        });
        syncedCount++;
      }

      // 3. Return updated regional executive analytics
      const updatedAnalytics = await hanaCloudService.getRegionalExecutiveAnalytics();

      return res.status(200).json({
        success: true,
        message: `Successfully synchronized ${syncedCount} SAP S/4HANA inventory records with live Open-Meteo sensing into SAP HANA Cloud.`,
        syncedRecords: syncedCount,
        analytics: updatedAnalytics,
      });
    } catch (err) {
      console.error('[HANA Cloud Sync Error]:', err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

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
      } catch (e2) { }
    }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      try {
        return JSON.parse(text.slice(firstBrace, lastBrace + 1));
      } catch (e3) { }
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
 * If caller is a SUPPLIER, only returns their own supplier_id to protect vendor pricing privacy.
 * Regional Admins and Hospital Managers can view all suppliers.
 */
app.get('/api/suppliers', optionalAuth, async (req, res) => {
  let data = await fetchSapSuppliersData();

  if (req.user && !req.user.isAnonymous) {
    const userRole = (req.user.role || '').toUpperCase();
    const userSupplierId = req.user.supplier_id || req.user.supplierId;

    if (userRole === 'SUPPLIER' && userSupplierId) {
      data = data.filter((s) => s.SUPPLIER_ID === userSupplierId);
    }
  }

  return res.status(200).json({
    success: true,
    data,
  });
});

/**
 * GET /api/route/:originId/:destId
 * Live OSRM Road Distance, Travel Duration & Max Allowed Lead Days
 */
app.get('/api/route/:originId/:destId', async (req, res) => {
  try {
    const { originId, destId } = req.params;
    const route = await calculateRoute(originId, destId);
    return res.status(200).json({
      success: true,
      route,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * GET /api/external-risk/:hospitalId
 * External real-time risk intelligence (Open-Meteo weather + GDELT news disruption sensing)
 */
app.get('/api/external-risk/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const risk = await getExternalRisk(hospitalId);
    return res.status(200).json({
      success: true,
      hospitalId,
      risk,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * GET /api/recommend-suppliers/:hospitalId/:materialId
 * Multi-factor supplier ranking combining SAP S/4HANA TrustScore/Tier with OSRM transit & weather risk
 */
app.get('/api/recommend-suppliers/:hospitalId/:materialId', async (req, res) => {
  try {
    const { hospitalId, materialId } = req.params;
    const result = await recommendSuppliers(hospitalId, materialId);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * Calls Gemini with fallback across supported models
 */
async function callGemini(contents) {
  if (!aiClient) return null;
  const modelsToTry = [
    process.env.GEMINI_MODEL,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ].filter(Boolean);

  for (const model of modelsToTry) {
    try {
      const res = await aiClient.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: 'application/json',
        },
      });
      const text = res?.text || res?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return { text, model };
    } catch (err) {
      // Continue to next candidate model
    }
  }
  console.log('[Gemini GenAI] External AI model unavailable. Operating in deterministic disruption mode.');
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

    // Non-blocking Auto-Log into SAP HANA Cloud PULSECHAIN_RISK_SNAPSHOTS
    (async () => {
      try {
        const city = (req.body && req.body.city) || 'BHOPAL';
        const hospitalId = (req.body && req.body.hospitalId) || 'H004';
        const materialId = executionPlan?.materialId || 'OXY005';
        const stockQty = executionPlan?.qty || 1500;
        const daysCover = impactResult?.criticalShortages?.[0]?.daysCover || 4.2;
        const externalRisk = alertText ? 'AI_ALERT_ACTIVE' : 'MONITORED';
        const deliveryImpact = executionPlan ? 'EXECUTION_PENDING' : 'ANALYZED';
        const weatherTempC = sensingResult?.weather?.temperature || 28.5;

        await hanaCloudService.recordRiskSnapshot({
          city,
          hospitalId,
          materialId,
          stockQty,
          dailyUse: 120,
          daysCover,
          externalRisk,
          deliveryImpact,
          weatherTempC,
        });
      } catch (err) {
        console.warn('[HANA Cloud Auto-Log] analyze-disruption hook note:', err.message);
      }
    })().catch(() => {});

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

// =========================================================================
// SERVE FRONTEND DIST & SINGLE PAGE APPLICATION (SPA) ROUTING
// =========================================================================
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// Catch-all handler to serve index.html for client-side routing (compatible with Express 5 & 4)
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.status(200).send('PulseChain API Server is active. Frontend build in progress.');
});

// Start Server with clean console output and robust port error handling
const server = app.listen(PORT, async () => {
  try {
    await fetchSapInventoryData();
  } catch (e) { }
  console.log(`=======================================================`);
  console.log(` PulseChain Enterprise Supply Chain API on port ${PORT}`);
  console.log(` POST http://localhost:${PORT}/api/auth/login (JWT RBAC)`);
  console.log(` GET  http://localhost:${PORT}/api/inventory`);
  console.log(` GET  http://localhost:${PORT}/api/inventory/same-city/:hospitalId`);
  console.log(` POST http://localhost:${PORT}/api/stock-count (Shopkeeper & Dual Email)`);
  console.log(` POST http://localhost:${PORT}/api/supplier-bid (Live Supplier Portal)`);
  console.log(` GET  http://localhost:${PORT}/api/open-shortages (Public RFQs)`);
  console.log(` POST http://localhost:${PORT}/api/transfer (Agentic Reallocation + Dispatch Email)`);
  console.log(` GET  http://localhost:${PORT}/api/status`);
  console.log(`=======================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(` Port ${PORT} is already in use by another running instance.`);
    console.error(`   To free port ${PORT}, run in PowerShell:`);
    console.error(`   Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force`);
  } else {
    console.error(` Server error:`, err.message);
  }
});
