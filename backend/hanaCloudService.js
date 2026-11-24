/**
 * PulseChain - SAP HANA Cloud Analytics Service
 * Connects to SAP HANA Cloud Warehouse (Hackfest0418) over TLS (Port 443).
 * Manages columnar analytics tables:
 * - PULSECHAIN_RISK_SNAPSHOTS
 * - PULSECHAIN_SUPPLIER_SLA
 * - V_REGIONAL_EXEC_SUMMARY
 */

const hdb = require('hdb');
const fs = require('fs');
const path = require('path');

// Local fallback cache for resilience when HANA Cloud is paused/offline
const CACHE_FILE = path.join(__dirname, 'data/hana_cloud_offline_cache.json');

// Initial seed data for offline/paused resilience
const DEFAULT_SEED_DATA = {
  regionalSummary: [
    {
      CITY: 'BHOPAL',
      MONITORED_HOSPITALS: 3,
      AVG_DAYS_COVER: 14.8,
      CRITICAL_ALERTS: 1,
      HIGH_RISK_EVENTS: 2,
      LAST_SNAPSHOT_AT: new Date().toISOString(),
    },
    {
      CITY: 'INDORE',
      MONITORED_HOSPITALS: 2,
      AVG_DAYS_COVER: 18.2,
      CRITICAL_ALERTS: 0,
      HIGH_RISK_EVENTS: 1,
      LAST_SNAPSHOT_AT: new Date().toISOString(),
    },
    {
      CITY: 'JABALPUR',
      MONITORED_HOSPITALS: 1,
      AVG_DAYS_COVER: 8.5,
      CRITICAL_ALERTS: 2,
      HIGH_RISK_EVENTS: 3,
      LAST_SNAPSHOT_AT: new Date().toISOString(),
    },
  ],
  riskSnapshots: [
    {
      ID: 'SNAP-BH-001',
      CITY: 'BHOPAL',
      HOSPITAL_ID: 'H004',
      MATERIAL_ID: 'OXY005',
      STOCK_QTY: 1850,
      DAILY_USE: 120,
      DAYS_COVER: 15.4,
      EXTERNAL_RISK: 'MODERATE_RAIN',
      DELIVERY_IMPACT: 'ON_TIME',
      WEATHER_TEMP_C: 28.5,
      RECORDED_AT: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      ID: 'SNAP-BH-002',
      CITY: 'BHOPAL',
      HOSPITAL_ID: 'H004',
      MATERIAL_ID: 'INS001',
      STOCK_QTY: 620,
      DAILY_USE: 85,
      DAYS_COVER: 7.3,
      EXTERNAL_RISK: 'PORT_CONGESTION',
      DELIVERY_IMPACT: 'DELAYED',
      WEATHER_TEMP_C: 29.0,
      RECORDED_AT: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      ID: 'SNAP-IN-001',
      CITY: 'INDORE',
      HOSPITAL_ID: 'H006',
      MATERIAL_ID: 'PROP001',
      STOCK_QTY: 2100,
      DAILY_USE: 110,
      DAYS_COVER: 19.1,
      EXTERNAL_RISK: 'LOW',
      DELIVERY_IMPACT: 'ON_TIME',
      WEATHER_TEMP_C: 26.2,
      RECORDED_AT: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      ID: 'SNAP-JB-001',
      CITY: 'JABALPUR',
      HOSPITAL_ID: 'H003',
      MATERIAL_ID: 'AMX002',
      STOCK_QTY: 410,
      DAILY_USE: 65,
      DAYS_COVER: 6.3,
      EXTERNAL_RISK: 'HEATWAVE_EXCURSION',
      DELIVERY_IMPACT: 'CANCELLATION_RISK',
      WEATHER_TEMP_C: 38.1,
      RECORDED_AT: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
  ],
  supplierSla: [
    {
      ID: 'SLA-1001',
      SUPPLIER_ID: 'V1001',
      MATERIAL_ID: 'OXY005',
      TRUST_SCORE: 95.0,
      SUPPLIER_TIER: 'PLATINUM',
      OSRM_TRAVEL_DAYS: 1.0,
      PROMISED_LEAD_DAYS: 1.0,
      DELAY_FLAG: 'N',
      DELAY_REASON: 'On-schedule transit via Express Corridor NH-46',
      RECORDED_AT: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
    {
      ID: 'SLA-1002',
      SUPPLIER_ID: 'V1002',
      MATERIAL_ID: 'INS001',
      TRUST_SCORE: 84.8,
      SUPPLIER_TIER: 'GOLD',
      OSRM_TRAVEL_DAYS: 2.0,
      PROMISED_LEAD_DAYS: 2.0,
      DELAY_FLAG: 'N',
      DELAY_REASON: 'Standard road transit',
      RECORDED_AT: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    },
    {
      ID: 'SLA-1003',
      SUPPLIER_ID: 'V1003',
      MATERIAL_ID: 'PROP001',
      TRUST_SCORE: 45.0,
      SUPPLIER_TIER: 'BLOCKED',
      OSRM_TRAVEL_DAYS: 1.0,
      PROMISED_LEAD_DAYS: 3.5,
      DELAY_FLAG: 'Y',
      DELAY_REASON: 'Cold-chain refrigeration malfunction during port transit',
      RECORDED_AT: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    },
  ],
};

// Load offline cache
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[HANA Cloud] Cache load warning:', err.message);
  }
  return DEFAULT_SEED_DATA;
}

// Save offline cache
function saveCache(data) {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[HANA Cloud] Cache save warning:', err.message);
  }
}

/**
 * Execute a query against SAP HANA Cloud with timeout and TLS
 */
function executeHanaQuery(sql, params = [], timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    const rawHost = process.env.HANA_HOST || '';
    if (!rawHost || rawHost.includes('<guid>') || rawHost.trim() === '') {
      return reject(new Error('HANA_HOST is not configured or contains placeholder.'));
    }

    let host = rawHost.trim();
    let port = parseInt(process.env.HANA_PORT || '443', 10);
    // Sanitize host if provided with :port
    if (host.includes(':')) {
      const parts = host.split(':');
      host = parts[0];
      if (parts[1]) {
        port = parseInt(parts[1], 10);
      }
    }

    const client = hdb.createClient({
      host,
      port,
      user: process.env.HANA_USER || 'Hackfest0418',
      password: process.env.HANA_PASSWORD || 'HackfestTest02@SAP',
      useTLS: true,
      rejectUnauthorized: false, // Cloud sandbox TLS compatibility
    });

    let isFinished = false;
    const timer = setTimeout(() => {
      isFinished = true;
      try { client.disconnect(); } catch (e) {}
      reject(new Error(`SAP HANA Cloud query timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    client.on('error', (err) => {
      if (!isFinished) {
        isFinished = true;
        clearTimeout(timer);
        try { client.disconnect(); } catch (e) {}
        reject(err);
      }
    });

    client.connect((err) => {
      if (err) {
        if (!isFinished) {
          isFinished = true;
          clearTimeout(timer);
          try { client.disconnect(); } catch (e) {}
          return reject(err);
        }
        return;
      }

      if (params && params.length > 0) {
        client.prepare(sql, (prepErr, statement) => {
          if (prepErr) {
            if (!isFinished) {
              isFinished = true;
              clearTimeout(timer);
              try { client.disconnect(); } catch (e) {}
              return reject(prepErr);
            }
            return;
          }
          statement.exec(params, (execErr, rows) => {
            if (!isFinished) {
              isFinished = true;
              clearTimeout(timer);
              try { client.disconnect(); } catch (e) {}
              if (execErr) return reject(execErr);
              resolve(rows || []);
            }
          });
        });
      } else {
        client.exec(sql, (execErr, rows) => {
          if (!isFinished) {
            isFinished = true;
            clearTimeout(timer);
            try { client.disconnect(); } catch (e) {}
            if (execErr) return reject(execErr);
            resolve(rows || []);
          }
        });
      }
    });
  });
}

let tablesEnsured = false;
async function ensureHanaTables() {
  if (tablesEnsured) return;
  try {
    // 1. Column Table PULSECHAIN_RISK_SNAPSHOTS
    await executeHanaQuery(`
      CREATE COLUMN TABLE PULSECHAIN_RISK_SNAPSHOTS (
        ID NVARCHAR(64) PRIMARY KEY,
        CITY NVARCHAR(64),
        HOSPITAL_ID NVARCHAR(32),
        MATERIAL_ID NVARCHAR(32),
        STOCK_QTY INTEGER,
        DAILY_USE INTEGER,
        DAYS_COVER DECIMAL(5,1),
        EXTERNAL_RISK NVARCHAR(64),
        DELIVERY_IMPACT NVARCHAR(64),
        WEATHER_TEMP_C DECIMAL(4,1),
        RECORDED_AT TIMESTAMP DEFAULT CURRENT_UTCTIMESTAMP
      )
    `).catch(() => {});

    // 2. Column Table PULSECHAIN_SUPPLIER_SLA
    await executeHanaQuery(`
      CREATE COLUMN TABLE PULSECHAIN_SUPPLIER_SLA (
        ID NVARCHAR(64) PRIMARY KEY,
        SUPPLIER_ID NVARCHAR(32),
        MATERIAL_ID NVARCHAR(32),
        TRUST_SCORE DECIMAL(5,2),
        SUPPLIER_TIER NVARCHAR(32),
        OSRM_TRAVEL_DAYS DECIMAL(4,1),
        PROMISED_LEAD_DAYS DECIMAL(4,1),
        DELAY_FLAG NVARCHAR(1),
        DELAY_REASON NVARCHAR(256),
        RECORDED_AT TIMESTAMP DEFAULT CURRENT_UTCTIMESTAMP
      )
    `).catch(() => {});

    // 3. Analytics View V_REGIONAL_EXEC_SUMMARY
    await executeHanaQuery(`
      CREATE VIEW V_REGIONAL_EXEC_SUMMARY AS
      SELECT 
        CITY,
        COUNT(DISTINCT HOSPITAL_ID) AS MONITORED_HOSPITALS,
        ROUND(AVG(DAYS_COVER), 1) AS AVG_DAYS_COVER,
        SUM(CASE WHEN DAYS_COVER < 12 THEN 1 ELSE 0 END) AS CRITICAL_ALERTS,
        SUM(CASE WHEN EXTERNAL_RISK != 'LOW' THEN 1 ELSE 0 END) AS HIGH_RISK_EVENTS,
        MAX(RECORDED_AT) AS LAST_SNAPSHOT_AT
      FROM PULSECHAIN_RISK_SNAPSHOTS
      GROUP BY CITY
    `).catch(() => {});

    tablesEnsured = true;
  } catch (e) {
    // Handled gracefully
  }
}

/**
 * 1. pingHanaCloud()
 * Executes SELECT CURRENT_UTCTIMESTAMP AS NOW FROM DUMMY
 */
async function pingHanaCloud() {
  const user = process.env.HANA_USER || 'Hackfest0418';
  try {
    const rows = await executeHanaQuery('SELECT CURRENT_UTCTIMESTAMP AS NOW FROM DUMMY', [], 4000);
    const timestamp = rows && rows[0] ? rows[0].NOW : new Date().toISOString();
    return {
      connected: true,
      engine: 'SAP HANA Cloud',
      user,
      schema: user,
      host: process.env.HANA_HOST || 'Connected',
      port: process.env.HANA_PORT || 443,
      timestamp,
      status: 'ONLINE',
    };
  } catch (err) {
    return {
      connected: false,
      engine: 'SAP HANA Cloud (Offline Fallback)',
      user,
      schema: user,
      error: err.message,
      timestamp: new Date().toISOString(),
      status: 'PAUSED_OR_STANDBY',
    };
  }
}

/**
 * 2. recordRiskSnapshot({ city, hospitalId, materialId, stockQty, dailyUse, daysCover, externalRisk, deliveryImpact, weatherTempC })
 * Inserts a live row into PULSECHAIN_RISK_SNAPSHOTS.
 */
async function recordRiskSnapshot(snapshot) {
  const {
    city = 'BHOPAL',
    hospitalId = 'H004',
    materialId = 'GEN001',
    stockQty = 0,
    dailyUse = 0,
    daysCover = 0,
    externalRisk = 'LOW',
    deliveryImpact = 'ON_TIME',
    weatherTempC = 25.0,
  } = snapshot;

  const id = `SNAP-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
  const recordedAt = new Date().toISOString();

  const record = {
    ID: id,
    CITY: (city || 'BHOPAL').toUpperCase(),
    HOSPITAL_ID: hospitalId,
    MATERIAL_ID: materialId,
    STOCK_QTY: Number(stockQty) || 0,
    DAILY_USE: Number(dailyUse) || 0,
    DAYS_COVER: Number(daysCover) || 0,
    EXTERNAL_RISK: externalRisk,
    DELIVERY_IMPACT: deliveryImpact,
    WEATHER_TEMP_C: Number(weatherTempC) || 25.0,
    RECORDED_AT: recordedAt,
  };

  // Always update local cache for non-blocking reliability
  const cache = loadCache();
  cache.riskSnapshots = [record, ...(cache.riskSnapshots || [])].slice(0, 50);

  // Recalculate view in cache
  const cityMap = {};
  cache.riskSnapshots.forEach((snap) => {
    const c = snap.CITY || 'BHOPAL';
    if (!cityMap[c]) {
      cityMap[c] = {
        hospitals: new Set(),
        totalDays: 0,
        count: 0,
        critical: 0,
        highRisk: 0,
        lastTime: snap.RECORDED_AT,
      };
    }
    cityMap[c].hospitals.add(snap.HOSPITAL_ID);
    cityMap[c].totalDays += snap.DAYS_COVER;
    cityMap[c].count += 1;
    if (snap.DAYS_COVER < 12) cityMap[c].critical += 1;
    if (snap.EXTERNAL_RISK && snap.EXTERNAL_RISK !== 'LOW') cityMap[c].highRisk += 1;
  });

  cache.regionalSummary = Object.keys(cityMap).map((c) => ({
    CITY: c,
    MONITORED_HOSPITALS: cityMap[c].hospitals.size || 1,
    AVG_DAYS_COVER: Number((cityMap[c].totalDays / cityMap[c].count).toFixed(1)),
    CRITICAL_ALERTS: cityMap[c].critical,
    HIGH_RISK_EVENTS: cityMap[c].highRisk,
    LAST_SNAPSHOT_AT: cityMap[c].lastTime,
  }));
  saveCache(cache);

  // Attempt live SAP HANA Cloud INSERT
  try {
    await ensureHanaTables();
    const sql = `
      INSERT INTO PULSECHAIN_RISK_SNAPSHOTS 
      (ID, CITY, HOSPITAL_ID, MATERIAL_ID, STOCK_QTY, DAILY_USE, DAYS_COVER, EXTERNAL_RISK, DELIVERY_IMPACT, WEATHER_TEMP_C)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      record.ID,
      record.CITY,
      record.HOSPITAL_ID,
      record.MATERIAL_ID,
      record.STOCK_QTY,
      record.DAILY_USE,
      record.DAYS_COVER,
      record.EXTERNAL_RISK,
      record.DELIVERY_IMPACT,
      record.WEATHER_TEMP_C,
    ];

    await executeHanaQuery(sql, params, 4000);
    return { success: true, liveHana: true, id, record };
  } catch (err) {
    // Non-blocking fallback: cache preserved
    return { success: true, liveHana: false, id, record, note: err.message };
  }
}

/**
 * 3. recordSupplierSla({ supplierId, materialId, trustScore, supplierTier, osrmTravelDays, promisedLeadDays, delayFlag, delayReason })
 * Inserts a live row into PULSECHAIN_SUPPLIER_SLA.
 */
async function recordSupplierSla(sla) {
  const {
    supplierId = 'V1001',
    materialId = 'OXY005',
    trustScore = 95.0,
    supplierTier = 'PLATINUM',
    osrmTravelDays = 1.0,
    promisedLeadDays = 1.0,
    delayFlag = 'N',
    delayReason = '',
  } = sla;

  const id = `SLA-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
  const recordedAt = new Date().toISOString();

  const record = {
    ID: id,
    SUPPLIER_ID: supplierId,
    MATERIAL_ID: materialId,
    TRUST_SCORE: Number(trustScore) || 85.0,
    SUPPLIER_TIER: (supplierTier || 'GOLD').toUpperCase(),
    OSRM_TRAVEL_DAYS: Number(osrmTravelDays) || 1.0,
    PROMISED_LEAD_DAYS: Number(promisedLeadDays) || 1.0,
    DELAY_FLAG: delayFlag || (promisedLeadDays > osrmTravelDays + 1 ? 'Y' : 'N'),
    DELAY_REASON: delayReason || (delayFlag === 'Y' ? 'Transit variance detected' : 'Within OSRM guardrail'),
    RECORDED_AT: recordedAt,
  };

  // Always update local cache
  const cache = loadCache();
  cache.supplierSla = [record, ...(cache.supplierSla || [])].slice(0, 50);
  saveCache(cache);

  // Attempt live SAP HANA Cloud INSERT
  try {
    await ensureHanaTables();
    const sql = `
      INSERT INTO PULSECHAIN_SUPPLIER_SLA
      (ID, SUPPLIER_ID, MATERIAL_ID, TRUST_SCORE, SUPPLIER_TIER, OSRM_TRAVEL_DAYS, PROMISED_LEAD_DAYS, DELAY_FLAG, DELAY_REASON)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      record.ID,
      record.SUPPLIER_ID,
      record.MATERIAL_ID,
      record.TRUST_SCORE,
      record.SUPPLIER_TIER,
      record.OSRM_TRAVEL_DAYS,
      record.PROMISED_LEAD_DAYS,
      record.DELAY_FLAG,
      record.DELAY_REASON,
    ];

    await executeHanaQuery(sql, params, 4000);
    return { success: true, liveHana: true, id, record };
  } catch (err) {
    return { success: true, liveHana: false, id, record, note: err.message };
  }
}

/**
 * 4. getRegionalExecutiveAnalytics()
 * Queries V_REGIONAL_EXEC_SUMMARY, the latest 15 rows of PULSECHAIN_RISK_SNAPSHOTS,
 * and PULSECHAIN_SUPPLIER_SLA directly from SAP HANA Cloud.
 */
async function getRegionalExecutiveAnalytics() {
  const cache = loadCache();
  const ping = await pingHanaCloud();

  if (!ping.connected) {
    return {
      success: true,
      connected: false,
      liveHana: false,
      engine: 'SAP HANA Cloud (Offline Fallback)',
      user: ping.user,
      schema: ping.schema,
      message: 'HANA Cloud sandbox paused or unreachable. Serving resilient cached executive analytics.',
      timestamp: new Date().toISOString(),
      regionalSummary: cache.regionalSummary || [],
      latestRiskSnapshots: (cache.riskSnapshots || []).slice(0, 15),
      supplierSlaMetrics: (cache.supplierSla || []).slice(0, 15),
    };
  }

  // HANA Cloud is connected! Query live tables
  try {
    await ensureHanaTables();
    // 1. Regional Summary View
    let regionalSummary = [];
    try {
      regionalSummary = await executeHanaQuery('SELECT * FROM V_REGIONAL_EXEC_SUMMARY', [], 5000);
    } catch (e) {
      regionalSummary = cache.regionalSummary || [];
    }

    // 2. Latest 15 Risk Snapshots
    let latestRiskSnapshots = [];
    try {
      latestRiskSnapshots = await executeHanaQuery(
        'SELECT TOP 15 * FROM PULSECHAIN_RISK_SNAPSHOTS ORDER BY RECORDED_AT DESC',
        [],
        5000
      );
    } catch (e) {
      latestRiskSnapshots = (cache.riskSnapshots || []).slice(0, 15);
    }

    // 3. Latest 15 Supplier SLA rows
    let supplierSlaMetrics = [];
    try {
      supplierSlaMetrics = await executeHanaQuery(
        'SELECT TOP 15 * FROM PULSECHAIN_SUPPLIER_SLA ORDER BY RECORDED_AT DESC',
        [],
        5000
      );
    } catch (e) {
      supplierSlaMetrics = (cache.supplierSla || []).slice(0, 15);
    }

    // Sync cache with live rows if retrieved
    if (regionalSummary.length > 0) cache.regionalSummary = regionalSummary;
    if (latestRiskSnapshots.length > 0) cache.riskSnapshots = latestRiskSnapshots;
    if (supplierSlaMetrics.length > 0) cache.supplierSla = supplierSlaMetrics;
    saveCache(cache);

    return {
      success: true,
      connected: true,
      liveHana: true,
      engine: 'SAP HANA Cloud (Live Warehouse)',
      user: ping.user,
      schema: ping.schema,
      host: ping.host,
      timestamp: new Date().toISOString(),
      regionalSummary,
      latestRiskSnapshots,
      supplierSlaMetrics,
    };
  } catch (err) {
    return {
      success: true,
      connected: false,
      liveHana: false,
      engine: 'SAP HANA Cloud',
      user: ping.user,
      schema: ping.schema,
      error: err.message,
      timestamp: new Date().toISOString(),
      regionalSummary: cache.regionalSummary || [],
      latestRiskSnapshots: (cache.riskSnapshots || []).slice(0, 15),
      supplierSlaMetrics: (cache.supplierSla || []).slice(0, 15),
    };
  }
}

module.exports = {
  pingHanaCloud,
  recordRiskSnapshot,
  recordSupplierSla,
  getRegionalExecutiveAnalytics,
  executeHanaQuery,
};
