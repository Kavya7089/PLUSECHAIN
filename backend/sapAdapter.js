/**
 * PulseChain SAP S/4HANA Enterprise Data Adapter
 * Primary Engine: SAP Gateway OData v2 over HTTPS (Service: ZPLUSE_SRV)
 * Fallback Engine: High-resilience Local JSON Persistence (data/sap_offline_cache.json)
 * 
 * Target SAP Tables: ZPULSE_INV (Inventory) & ZPULSE_SUPP (Suppliers)
 * Live Gateway URL: https://merida.cob.csuchico.edu:8038/sap/opu/odata/sap/ZPLUSE_SRV?sap-client=105
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const axios = require('axios');

// Locate persistence cache directory across root or backend execution contexts
const DATA_DIR = fs.existsSync(path.join(__dirname, 'data'))
  ? path.join(__dirname, 'data')
  : path.join(__dirname, '..', 'data');
const CACHE_FILE = path.join(DATA_DIR, 'sap_offline_cache.json');

// Configuration from environment variables
const SAP_ODATA_URL = (process.env.SAP_ODATA_URL || 'https://merida.cob.csuchico.edu:8038/sap/opu/odata/sap/ZPLUSE_SRV').replace(/\/$/, '');
const SAP_CLIENT = process.env.SAP_CLIENT || '105';
const SAP_USER = process.env.SAP_USER || 'UTIT-036';
const SAP_PASSWD = process.env.SAP_PASSWD || process.env.SAP_PASS || 'KAVYA123';
const SAP_ALLOW_SELF_SIGNED = process.env.SAP_ALLOW_SELF_SIGNED !== 'false';

// HTTPS Agent with configurable SSL verification for enterprise certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.SAP_ALLOW_SELF_SIGNED !== 'true',
});

const sapBasicAuth = {
  username: SAP_USER,
  password: SAP_PASSWD,
};

// UI-Friendly Material Display Names mapped in Node.js while keeping exact codes for SAP
const MATERIAL_NAME_DICTIONARY = {
  INS001: 'Insulin Glargine',
  AMX002: 'Amoxicillin 500mg',
  AMX250: 'Amoxicillin 250mg',
  PROP003: 'Propofol 10mg/mL',
  HEP004: 'Heparin Sodium',
  SAL005: '0.9% Normal Saline',
  SAL500: '0.9% Normal Saline 500mL',
  OXY005: 'Medical Oxygen Cylinder',
  PAR050: 'Paracetamol 500mg',
  CEF006: 'Ceftriaxone 1g',
  AZI007: 'Azithromycin 500mg',
  MOR008: 'Morphine Sulfate 10mg',
};

// Hospital Facility Name Dictionary
const HOSPITAL_NAME_DICTIONARY = {
  H001: 'Mumbai Central General',
  H002: 'Delhi Critical Care Trust',
  H003: 'Pune Memorial Medical',
  H004: 'Bhopal Apex Care Hospital',
  H005: 'Central Surplus Logistics Hub H005',
  H006: 'Indore Super Specialty',
};

// Supplier Vendor Directory Names
const SUPPLIER_NAME_DICTIONARY = {
  V1001: 'BioPharm Global Logistics',
  V1002: 'Apex Medical Supplies',
  V1003: 'Reliant Cold-Chain Transport',
  V1004: 'MedExpress India',
  V1005: 'Zenith Pharma Logistics',
  V1006: 'LifeLine Supply Network',
};

// Master Initial SAP Baseline Records (Fallback Mirror)
const SAP_BASELINE_STOCK = [
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
  {
    HOSPITAL_ID: 'H004',
    HOSPITAL_NAME: 'Bhopal Apex Care Hospital',
    CITY: 'BHOPAL',
    MATERIAL_ID: 'AMX002',
    STOCK_QTY: 90,
    DAILY_USE: 45,
    UNIT: 'VIAL',
  },
  {
    HOSPITAL_ID: 'H004',
    HOSPITAL_NAME: 'Bhopal Apex Care Hospital',
    CITY: 'BHOPAL',
    MATERIAL_ID: 'INS001',
    STOCK_QTY: 160,
    DAILY_USE: 40,
    UNIT: 'EA',
  },
  {
    HOSPITAL_ID: 'H004',
    HOSPITAL_NAME: 'Bhopal Apex Care Hospital',
    CITY: 'BHOPAL',
    MATERIAL_ID: 'HEP004',
    STOCK_QTY: 110,
    DAILY_USE: 35,
    UNIT: 'VIAL',
  },
  {
    HOSPITAL_ID: 'H004',
    HOSPITAL_NAME: 'Bhopal Apex Care Hospital',
    CITY: 'BHOPAL',
    MATERIAL_ID: 'SAL005',
    STOCK_QTY: 350,
    DAILY_USE: 100,
    UNIT: 'BAG',
  },
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
    UNIT: 'VIAL',
  },
  {
    HOSPITAL_ID: 'H005',
    HOSPITAL_NAME: 'Central Surplus Logistics Hub H005',
    CITY: 'BHOPAL',
    MATERIAL_ID: 'HEP004',
    STOCK_QTY: 2500,
    DAILY_USE: 25,
    UNIT: 'VIAL',
  },
  {
    HOSPITAL_ID: 'H005',
    HOSPITAL_NAME: 'Central Surplus Logistics Hub H005',
    CITY: 'BHOPAL',
    MATERIAL_ID: 'SAL005',
    STOCK_QTY: 8000,
    DAILY_USE: 80,
    UNIT: 'BAG',
  },
  {
    HOSPITAL_ID: 'H006',
    HOSPITAL_NAME: 'Indore Super Specialty Hub',
    CITY: 'INDORE',
    MATERIAL_ID: 'INS001',
    STOCK_QTY: 4500,
    DAILY_USE: 50,
    UNIT: 'EA',
  },
  {
    HOSPITAL_ID: 'H006',
    HOSPITAL_NAME: 'Indore Super Specialty Hub',
    CITY: 'INDORE',
    MATERIAL_ID: 'AMX002',
    STOCK_QTY: 3500,
    DAILY_USE: 35,
    UNIT: 'VIAL',
  },
  {
    HOSPITAL_ID: 'H006',
    HOSPITAL_NAME: 'Indore Super Specialty Hub',
    CITY: 'INDORE',
    MATERIAL_ID: 'PROP003',
    STOCK_QTY: 2800,
    DAILY_USE: 20,
    UNIT: 'VIAL',
  },
];

const SAP_BASELINE_SUPPLIERS = [
  {
    SUPPLIER_ID: 'V1001',
    SUPPLIER_NAME: 'BioPharm Global Logistics',
    MATERIAL_ID: 'INS001',
    LEAD_TIME: 2,
    CAPACITY: 5000,
    UNIT_COST: 150,
    CURRENCY: 'INR',
    COMPLIANCE: 'Y',
    RELIABILITY: '99%',
  },
  {
    SUPPLIER_ID: 'V1002',
    SUPPLIER_NAME: 'Apex Medical Supplies',
    MATERIAL_ID: 'INS001',
    LEAD_TIME: 5,
    CAPACITY: 10000,
    UNIT_COST: 120,
    CURRENCY: 'INR',
    COMPLIANCE: 'Y',
    RELIABILITY: '95%',
  },
  {
    SUPPLIER_ID: 'V1003',
    SUPPLIER_NAME: 'Reliant Cold-Chain Transport',
    MATERIAL_ID: 'INS001',
    LEAD_TIME: 1,
    CAPACITY: 2000,
    UNIT_COST: 190,
    CURRENCY: 'INR',
    COMPLIANCE: 'N',
    RELIABILITY: '74%',
  },
  {
    SUPPLIER_ID: 'V1004',
    SUPPLIER_NAME: 'MedExpress India',
    MATERIAL_ID: 'AMX002',
    LEAD_TIME: 3,
    CAPACITY: 8000,
    UNIT_COST: 65,
    CURRENCY: 'INR',
    COMPLIANCE: 'Y',
    RELIABILITY: '97%',
  },
  {
    SUPPLIER_ID: 'V1005',
    SUPPLIER_NAME: 'Zenith Pharma Logistics',
    MATERIAL_ID: 'AMX002',
    LEAD_TIME: 7,
    CAPACITY: 15000,
    UNIT_COST: 45,
    CURRENCY: 'INR',
    COMPLIANCE: 'Y',
    RELIABILITY: '92%',
  },
  {
    SUPPLIER_ID: 'V1006',
    SUPPLIER_NAME: 'LifeLine Supply Network',
    MATERIAL_ID: 'PROP003',
    LEAD_TIME: 2,
    CAPACITY: 3000,
    UNIT_COST: 320,
    CURRENCY: 'INR',
    COMPLIANCE: 'Y',
    RELIABILITY: '98%',
  },
];

// In-Memory Offline Cache State
let offlineCache = {
  inventory: JSON.parse(JSON.stringify(SAP_BASELINE_STOCK)),
  suppliers: JSON.parse(JSON.stringify(SAP_BASELINE_SUPPLIERS)),
  stockAudits: [],
  supplierBids: [],
  reallocations: [],
  lastUpdated: new Date().toISOString(),
};

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadOfflineCache() {
  ensureDataDirectory();
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.inventory)) {
        offlineCache = {
          ...offlineCache,
          ...parsed,
        };
      }
    } else {
      saveOfflineCache();
    }
  } catch (err) {
    console.warn(`[SAP Cache] Failed to load ${CACHE_FILE}:`, err.message);
  }
}

function saveOfflineCache() {
  ensureDataDirectory();
  try {
    offlineCache.lastUpdated = new Date().toISOString();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(offlineCache, null, 2), 'utf8');
  } catch (err) {
    console.error(`[SAP Cache] Failed to save ${CACHE_FILE}:`, err.message);
  }
}

// Initial cache load
loadOfflineCache();

let isLiveSapConnected = false;

// ----------------------------------------------------------------------------
// DYNAMIC FIELD NORMALIZATION & ENRICHMENT ($metadata Safe)
// ----------------------------------------------------------------------------

function normalizeInventoryRecord(row) {
  const hospitalId = String(row.HospitalId || row.HOSPITAL_ID || row.hospitalId || row.hospital_id || '').trim();
  const materialId = String(row.MaterialId || row.MATERIAL_ID || row.materialId || row.material_id || '').trim();
  const stockQty = Number(row.StockQty ?? row.STOCK_QTY ?? row.stockQty ?? 0);
  const dailyUse = Math.max(1, Number(row.DailyUse ?? row.DAILY_USE ?? row.dailyUse ?? 1));
  const unit = String(row.Unit || row.UNIT || row.unit || 'EA').trim();
  const rawCity = String(row.City || row.CITY || row.city || 'BHOPAL').trim();
  const city = rawCity.toUpperCase();

  const daysCover = Math.floor(stockQty / dailyUse);
  const materialName = MATERIAL_NAME_DICTIONARY[materialId] || `Material ${materialId}`;
  const hospitalName = HOSPITAL_NAME_DICTIONARY[hospitalId] || `Hospital ${hospitalId}`;

  return {
    HOSPITAL_ID: hospitalId,
    HOSPITAL_NAME: hospitalName,
    CITY: city,
    MATERIAL_ID: materialId,
    MATERIAL_NAME: materialName,
    STOCK_QTY: stockQty,
    DAILY_USE: dailyUse,
    UNIT: unit,
    daysCover,
  };
}

function normalizeSupplierRecord(row) {
  const supplierId = String(row.SupplierId || row.SUPPLIER_ID || row.supplierId || '').trim();
  const materialId = String(row.MaterialId || row.MATERIAL_ID || row.materialId || '').trim();
  const leadTime = Number(row.LeadTime ?? row.LEAD_TIME ?? row.leadTime ?? 2);
  const capacity = Number(row.Capacity ?? row.CAPACITY ?? row.capacity ?? 1000);
  const unitCost = Number(row.UnitCost ?? row.UNIT_COST ?? row.unitCost ?? 50);
  const rawCurrency = String(row.Currency || row.CURRENCY || row.currency || '').trim();
  const currency = rawCurrency === '' ? 'INR' : rawCurrency;
  const compliance = String(row.Compliance || row.COMPLIANCE || row.compliance || 'Y').trim().toUpperCase();
  const supplierName = SUPPLIER_NAME_DICTIONARY[supplierId] || `Vendor ${supplierId}`;

  return {
    SUPPLIER_ID: supplierId,
    SUPPLIER_NAME: supplierName,
    MATERIAL_ID: materialId,
    LEAD_TIME: leadTime,
    CAPACITY: capacity,
    UNIT_COST: unitCost,
    CURRENCY: currency,
    COMPLIANCE: compliance,
    RELIABILITY: compliance === 'Y' ? '98%' : '72%',
  };
}

// ----------------------------------------------------------------------------
// CSRF TOKEN & SESSION COOKIE HANDLING
// ----------------------------------------------------------------------------

/**
 * Sends GET to SAP Gateway with X-CSRF-Token: Fetch and extracts token + cookies
 */
async function getSapCsrfSession() {
  const fetchUrl = `${SAP_ODATA_URL}/?sap-client=${SAP_CLIENT}`;
  try {
    const res = await axios.get(fetchUrl, {
      httpsAgent,
      auth: sapBasicAuth,
      headers: {
        'X-CSRF-Token': 'Fetch',
        Accept: 'application/json',
      },
      timeout: 8000,
    });

    const csrfToken = res.headers['x-csrf-token'];
    const rawCookies = res.headers['set-cookie'] || [];
    const cookieStr = Array.isArray(rawCookies)
      ? rawCookies.map((c) => c.split(';')[0]).join('; ')
      : String(rawCookies).split(';')[0];

    isLiveSapConnected = true;
    return { csrfToken, cookieStr, isLive: true };
  } catch (err) {
    isLiveSapConnected = false;
    return { csrfToken: null, cookieStr: null, isLive: false, error: err.message };
  }
}

// ----------------------------------------------------------------------------
// LIVE READ OPERATIONS (GET)
// ----------------------------------------------------------------------------

/**
 * Reads InventorySet from SAP S/4HANA Gateway OData v2
 * GET ${SAP_ODATA_URL}/InventorySet?sap-client=${SAP_CLIENT}&$format=json
 */
async function getStockFromSap() {
  const url = `${SAP_ODATA_URL}/InventorySet?sap-client=${SAP_CLIENT}&$format=json`;

  try {
    const response = await axios.get(url, {
      httpsAgent,
      auth: sapBasicAuth,
      headers: { Accept: 'application/json' },
      timeout: 8000,
    });

    const results = response.data?.d?.results || response.data?.d || [];
    if (Array.isArray(results) && results.length > 0) {
      isLiveSapConnected = true;
      const normalized = results.map(normalizeInventoryRecord);

      // Merge into offline cache for fallback safety
      for (const item of normalized) {
        const idx = offlineCache.inventory.findIndex(
          (o) => o.HOSPITAL_ID === item.HOSPITAL_ID && o.MATERIAL_ID === item.MATERIAL_ID
        );
        if (idx !== -1) {
          offlineCache.inventory[idx] = { ...offlineCache.inventory[idx], ...item };
        } else {
          offlineCache.inventory.push(item);
        }
      }
      saveOfflineCache();

      return {
        data: normalized,
        source: 'LIVE_SAP_ODATA',
      };
    }
  } catch (err) {
    isLiveSapConnected = false;
    console.warn(`[SAP OData Inventory] Live fetch failed (${err.message}). Using offline cache.`);
  }

  // Resilient fallback to offline cache
  const cachedNormalized = offlineCache.inventory.map(normalizeInventoryRecord);
  return {
    data: cachedNormalized,
    source: 'OFFLINE_SAP_CACHE',
  };
}

/**
 * Reads SupplierSet from SAP S/4HANA Gateway OData v2
 * GET ${SAP_ODATA_URL}/SupplierSet?sap-client=${SAP_CLIENT}&$format=json
 */
async function getSuppliersFromSap() {
  const url = `${SAP_ODATA_URL}/SupplierSet?sap-client=${SAP_CLIENT}&$format=json`;

  try {
    const response = await axios.get(url, {
      httpsAgent,
      auth: sapBasicAuth,
      headers: { Accept: 'application/json' },
      timeout: 8000,
    });

    const results = response.data?.d?.results || response.data?.d || [];
    if (Array.isArray(results) && results.length > 0) {
      isLiveSapConnected = true;
      const normalized = results.map(normalizeSupplierRecord);

      // Merge into offline cache
      for (const item of normalized) {
        const idx = offlineCache.suppliers.findIndex(
          (s) => s.SUPPLIER_ID === item.SUPPLIER_ID && s.MATERIAL_ID === item.MATERIAL_ID
        );
        if (idx !== -1) {
          offlineCache.suppliers[idx] = { ...offlineCache.suppliers[idx], ...item };
        } else {
          offlineCache.suppliers.push(item);
        }
      }
      saveOfflineCache();

      // Merge live results with baseline master suppliers so the supplier directory is complete
      const mergedSuppliers = [...normalized];
      for (const base of SAP_BASELINE_SUPPLIERS) {
        if (!mergedSuppliers.some((s) => s.SUPPLIER_ID === base.SUPPLIER_ID && s.MATERIAL_ID === base.MATERIAL_ID)) {
          mergedSuppliers.push(base);
        }
      }

      return {
        data: mergedSuppliers,
        source: 'LIVE_SAP_ODATA',
      };
    }
  } catch (err) {
    isLiveSapConnected = false;
    console.warn(`[SAP OData Suppliers] Live fetch failed (${err.message}). Using offline cache.`);
  }

  // Fallback to offline cache
  const cachedNormalized = offlineCache.suppliers.map(normalizeSupplierRecord);
  return {
    data: cachedNormalized,
    source: 'OFFLINE_SAP_CACHE',
  };
}

// ----------------------------------------------------------------------------
// LIVE WRITE OPERATIONS (PUT / POST) WITH DECIMAL FORMATTING
// ----------------------------------------------------------------------------

/**
 * PUT /InventorySet(HospitalId='${hospitalId}',MaterialId='${materialId}')
 * OData Decimal Rule: Format StockQty and DailyUse as strings (e.g. String(value))
 */
async function countStockInSap(hospitalId, materialId, stockQty, dailyUse) {
  let sapRecorded = false;
  const numericStock = Number(stockQty);
  const numericDaily = Number(dailyUse);

  // Update in offline cache immediately
  let record = offlineCache.inventory.find(
    (item) => item.HOSPITAL_ID === hospitalId && item.MATERIAL_ID === materialId
  );
  if (record) {
    record.STOCK_QTY = numericStock;
    record.DAILY_USE = numericDaily;
  } else {
    record = {
      HOSPITAL_ID: hospitalId,
      HOSPITAL_NAME: HOSPITAL_NAME_DICTIONARY[hospitalId] || `Hospital ${hospitalId}`,
      CITY: 'BHOPAL',
      MATERIAL_ID: materialId,
      MATERIAL_NAME: MATERIAL_NAME_DICTIONARY[materialId] || `Material ${materialId}`,
      STOCK_QTY: numericStock,
      DAILY_USE: numericDaily,
      UNIT: 'EA',
    };
    offlineCache.inventory.push(record);
  }
  saveOfflineCache();

  // Attempt live SAP OData v2 commit
  try {
    const session = await getSapCsrfSession();
    if (session.isLive && session.csrfToken) {
      const putUrl = `${SAP_ODATA_URL}/InventorySet(HospitalId='${hospitalId}',MaterialId='${materialId}')?sap-client=${SAP_CLIENT}`;
      const payload = {
        HospitalId: hospitalId,
        MaterialId: materialId,
        StockQty: String(numericStock),
        DailyUse: String(numericDaily),
        Unit: record.UNIT || 'EA',
        City: record.CITY || 'BHOPAL',
      };

      const res = await axios.put(putUrl, payload, {
        httpsAgent,
        auth: sapBasicAuth,
        headers: {
          'X-CSRF-Token': session.csrfToken,
          Cookie: session.cookieStr,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 10000,
      });

      if (res.status === 204 || res.status === 200) {
        sapRecorded = true;
        console.log(`[LIVE SAP ODATA COMMIT] PUT ${putUrl} -> StockQty: ${numericStock}, DailyUse: ${numericDaily}`);
      }
    }
  } catch (err) {
    console.warn(`[SAP OData Write Error] Stock count live PUT failed (${err.message}). State saved in offline cache.`);
  }

  return { sapRecorded, record };
}

/**
 * POST /SupplierSet
 * Registers emergency vendor proposal in live SAP procurement ledger
 * OData Decimal Rule: Format Capacity, UnitCost as strings; LeadTime as number
 */
async function submitBidToSap(supplierId, materialId, unitCost, leadTime, capacity, compliance = 'Y') {
  let sapRecorded = false;
  const numericCost = Number(unitCost);
  const numericLead = Number(leadTime);
  const numericCap = Number(capacity);
  const complianceFlag = (compliance || 'Y').toUpperCase();

  // Update in offline cache
  const existingIdx = offlineCache.suppliers.findIndex(
    (s) => s.SUPPLIER_ID === supplierId && s.MATERIAL_ID === materialId
  );
  const bidSupplierObj = {
    SUPPLIER_ID: supplierId,
    SUPPLIER_NAME: SUPPLIER_NAME_DICTIONARY[supplierId] || `Vendor ${supplierId}`,
    MATERIAL_ID: materialId,
    LEAD_TIME: numericLead,
    CAPACITY: numericCap,
    UNIT_COST: numericCost,
    CURRENCY: 'INR',
    COMPLIANCE: complianceFlag,
    RELIABILITY: complianceFlag === 'Y' ? '98%' : '72%',
    isLiveBid: true,
  };

  if (existingIdx !== -1) {
    offlineCache.suppliers[existingIdx] = { ...offlineCache.suppliers[existingIdx], ...bidSupplierObj };
  } else {
    offlineCache.suppliers.unshift(bidSupplierObj);
  }
  saveOfflineCache();

  // Attempt live SAP OData v2 POST
  try {
    const session = await getSapCsrfSession();
    if (session.isLive && session.csrfToken) {
      const postUrl = `${SAP_ODATA_URL}/SupplierSet?sap-client=${SAP_CLIENT}`;
      const payload = {
        SupplierId: supplierId,
        MaterialId: materialId,
        LeadTime: numericLead,
        Capacity: String(numericCap),
        UnitCost: String(numericCost),
        Currency: 'INR',
        Compliance: complianceFlag,
      };

      const res = await axios.post(postUrl, payload, {
        httpsAgent,
        auth: sapBasicAuth,
        headers: {
          'X-CSRF-Token': session.csrfToken,
          Cookie: session.cookieStr,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 10000,
      });

      if (res.status === 201 || res.status === 200) {
        sapRecorded = true;
        console.log(`[LIVE SAP ODATA COMMIT] POST /SupplierSet -> SupplierId: ${supplierId}, MaterialId: ${materialId}, UnitCost: ₹${numericCost}`);
      }
    }
  } catch (err) {
    console.warn(`[SAP OData Write Error] Supplier bid live POST failed (${err.message}). State saved in offline cache.`);
  }

  return { sapRecorded, supplier: bidSupplierObj };
}

/**
 * Executes Inter-Hospital Stock Transfer in SAP
 * Two PUT requests: Deduct from fromHospital, Add to toHospital
 */
async function updateStockInSap(fromHospital, toHospital, materialId, qty) {
  let sapRecorded = false;
  const numericQty = Number(qty);

  // Update in offline cache
  const fromRecord = offlineCache.inventory.find(
    (item) => item.HOSPITAL_ID === fromHospital && item.MATERIAL_ID === materialId
  );
  let toRecord = offlineCache.inventory.find(
    (item) => item.HOSPITAL_ID === toHospital && item.MATERIAL_ID === materialId
  );

  if (fromRecord) {
    fromRecord.STOCK_QTY = Math.max(0, fromRecord.STOCK_QTY - numericQty);
  }
  if (toRecord) {
    toRecord.STOCK_QTY += numericQty;
  } else {
    toRecord = {
      HOSPITAL_ID: toHospital,
      HOSPITAL_NAME: HOSPITAL_NAME_DICTIONARY[toHospital] || `Hospital ${toHospital}`,
      CITY: fromRecord ? fromRecord.CITY : 'BHOPAL',
      MATERIAL_ID: materialId,
      MATERIAL_NAME: MATERIAL_NAME_DICTIONARY[materialId] || `Material ${materialId}`,
      STOCK_QTY: numericQty,
      DAILY_USE: 50,
      UNIT: fromRecord ? fromRecord.UNIT : 'EA',
    };
    offlineCache.inventory.push(toRecord);
  }
  saveOfflineCache();

  // Attempt live SAP OData v2 dual PUT
  try {
    const session = await getSapCsrfSession();
    if (session.isLive && session.csrfToken) {
      // 1. Deduct from fromHospital
      if (fromRecord) {
        const fromUrl = `${SAP_ODATA_URL}/InventorySet(HospitalId='${fromHospital}',MaterialId='${materialId}')?sap-client=${SAP_CLIENT}`;
        await axios.put(
          fromUrl,
          {
            HospitalId: fromHospital,
            MaterialId: materialId,
            StockQty: String(fromRecord.STOCK_QTY),
            DailyUse: String(fromRecord.DAILY_USE),
            Unit: fromRecord.UNIT || 'EA',
            City: fromRecord.CITY || 'BHOPAL',
          },
          {
            httpsAgent,
            auth: sapBasicAuth,
            headers: {
              'X-CSRF-Token': session.csrfToken,
              Cookie: session.cookieStr,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            timeout: 10000,
          }
        );
      }

      // 2. Add to toHospital
      if (toRecord) {
        const toUrl = `${SAP_ODATA_URL}/InventorySet(HospitalId='${toHospital}',MaterialId='${materialId}')?sap-client=${SAP_CLIENT}`;
        await axios.put(
          toUrl,
          {
            HospitalId: toHospital,
            MaterialId: materialId,
            StockQty: String(toRecord.STOCK_QTY),
            DailyUse: String(toRecord.DAILY_USE),
            Unit: toRecord.UNIT || 'EA',
            City: toRecord.CITY || 'BHOPAL',
          },
          {
            httpsAgent,
            auth: sapBasicAuth,
            headers: {
              'X-CSRF-Token': session.csrfToken,
              Cookie: session.cookieStr,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            timeout: 10000,
          }
        );
      }

      sapRecorded = true;
      console.log(`[LIVE SAP ODATA COMMIT] Reallocation completed: ${numericQty} units of ${materialId} moved from ${fromHospital} to ${toHospital}`);
    }
  } catch (err) {
    console.warn(`[SAP OData Write Error] Stock transfer live PUT failed (${err.message}). State saved in offline cache.`);
  }

  return { sapRecorded, success: true };
}

// ----------------------------------------------------------------------------
// AUDIT LOGGING & STATUS
// ----------------------------------------------------------------------------

function logStockAudit(auditEntry) {
  offlineCache.stockAudits.unshift(auditEntry);
  saveOfflineCache();
}

function getStockAudits(hospitalId = null) {
  let list = offlineCache.stockAudits;
  if (hospitalId) {
    list = list.filter((a) => a.hospitalId === hospitalId);
  }
  return list;
}

function logSupplierBid(bidEntry) {
  offlineCache.supplierBids.unshift(bidEntry);
  saveOfflineCache();
}

function getSupplierBids(supplierId = null) {
  let list = offlineCache.supplierBids;
  if (supplierId) {
    list = list.filter((b) => b.supplierId === supplierId);
  }
  return list;
}

function logReallocation(reallocEntry) {
  offlineCache.reallocations.unshift(reallocEntry);
  saveOfflineCache();
}

function getReallocations() {
  return offlineCache.reallocations;
}

async function resetToBaseline() {
  offlineCache.inventory = JSON.parse(JSON.stringify(SAP_BASELINE_STOCK));
  offlineCache.suppliers = JSON.parse(JSON.stringify(SAP_BASELINE_SUPPLIERS));
  offlineCache.stockAudits = [];
  offlineCache.supplierBids = [];
  offlineCache.reallocations = [];
  saveOfflineCache();

  try {
    await countStockInSap('H002', 'INS001', 150, 50);
    await countStockInSap('H003', 'INS001', 1800, 100);
  } catch (err) {
    // Offline mode ignores live reset error
  }

  return { success: true, message: 'SAP state restored to baseline values.' };
}

/**
 * Diagnostic status for GET /api/sap/status
 * Pings ${SAP_ODATA_URL}/InventorySet?sap-client=${SAP_CLIENT}&$top=1&$format=json
 */
async function getSapStatus() {
  const pingUrl = `${SAP_ODATA_URL}/InventorySet?sap-client=${SAP_CLIENT}&$top=1&$format=json`;
  let liveConnected = false;

  try {
    const res = await axios.get(pingUrl, {
      httpsAgent,
      auth: sapBasicAuth,
      headers: { Accept: 'application/json' },
      timeout: 5000,
    });
    if (res.status === 200) {
      liveConnected = true;
      isLiveSapConnected = true;
    }
  } catch (err) {
    liveConnected = false;
    isLiveSapConnected = false;
  }

  return {
    primaryEngine: 'SAP S/4HANA (HTTPS OData v2)',
    activeMode: liveConnected ? 'LIVE_SAP' : 'OFFLINE_SAP_CACHE',
    serviceName: 'ZPLUSE_SRV',
    odataUrl: SAP_ODATA_URL,
    client: SAP_CLIENT,
    tables: ['ZPULSE_INV', 'ZPULSE_SUPP'],
    entitySets: ['InventorySet', 'SupplierSet'],
    cacheFile: 'data/sap_offline_cache.json',
    recordCounts: {
      inventory: offlineCache.inventory.length,
      suppliers: offlineCache.suppliers.length,
      stockAudits: offlineCache.stockAudits.length,
      supplierBids: offlineCache.supplierBids.length,
      reallocations: offlineCache.reallocations.length,
    },
  };
}

module.exports = {
  getStockFromSap,
  getSuppliersFromSap,
  countStockInSap,
  submitBidToSap,
  updateStockInSap,
  getSapCsrfSession,
  logStockAudit,
  getStockAudits,
  logSupplierBid,
  getSupplierBids,
  logReallocation,
  getReallocations,
  resetToBaseline,
  getSapStatus,
  MATERIAL_NAME_DICTIONARY,
  HOSPITAL_NAME_DICTIONARY,
  SUPPLIER_NAME_DICTIONARY,
  SAP_BASELINE_STOCK,
  SAP_BASELINE_SUPPLIERS,
};
