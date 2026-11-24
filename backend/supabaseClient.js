/**
-- ============================================================================
-- PulseChain v3.1.0 — Supabase Admin Client
-- Connects securely to Supabase using Service Role Key for server-side auth & RLS
-- ============================================================================
*/

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zczftbiaerctvbbrgbgx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  '';

const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  !SUPABASE_URL.includes('YOUR_PROJECT_ID') &&
  SUPABASE_SERVICE_ROLE_KEY
);

let supabaseAdmin = null;

if (isSupabaseConfigured) {
  try {
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (err) {
    console.warn(`[Supabase Client] Failed to initialize client: ${err.message}`);
  }
} else {
  console.warn('[Supabase Client] Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing/placeholder.');
}

const isUUID = (str) =>
  typeof str === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());

// In-Memory Fallback Stores (Ensures high resilience when Supabase tables are pending migration)
const inMemoryStore = {
  supplier_bids: [],
  shipment_approvals: [],
  supplier_reviews: [],
  hospital_tasks: [],
  stock_audits: [],
  reallocation_logs: [],
};

/**
 * Logs stock count audit to Supabase public.stock_audits (non-ERP audit trail)
 */
async function logStockAuditToSupabase({ userId, hospitalId, materialId, previousQty, newQty, dailyUse, sapCommitted }) {
  const record = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `AUDIT-${Date.now()}`,
    user_id: isUUID(userId) ? userId.trim() : null,
    hospital_id: hospitalId,
    material_id: materialId,
    previous_qty: previousQty,
    new_qty: newQty,
    daily_use: dailyUse,
    sap_committed: Boolean(sapCommitted),
    created_at: new Date().toISOString(),
  };

  inMemoryStore.stock_audits.push(record);

  if (!supabaseAdmin) return record;
  try {
    const { data, error } = await supabaseAdmin
      .from('stock_audits')
      .insert([record])
      .select()
      .single();

    if (error) {
      console.warn(`[Supabase Audit] stock_audits insert note: ${error.message}`);
      return record;
    }
    return data;
  } catch (err) {
    return record;
  }
}

/**
 * Logs reallocation execution to Supabase public.reallocation_logs
 */
async function logReallocationToSupabase({ approvedBy, fromHospital, toHospital, materialId, qty, mode, supplierId, sapCommitted }) {
  const record = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `REALLOC-${Date.now()}`,
    approved_by: isUUID(approvedBy) ? approvedBy.trim() : null,
    from_hospital: fromHospital,
    to_hospital: toHospital,
    material_id: materialId,
    qty: qty,
    mode: mode || 'INTERNAL_TRANSFER',
    supplier_id: supplierId || null,
    sap_committed: Boolean(sapCommitted),
    created_at: new Date().toISOString(),
  };

  inMemoryStore.reallocation_logs.push(record);

  if (!supabaseAdmin) return record;
  try {
    const { data, error } = await supabaseAdmin
      .from('reallocation_logs')
      .insert([record])
      .select()
      .single();

    if (error) {
      return record;
    }
    return data;
  } catch (err) {
    return record;
  }
}

/**
 * Supplier Bids Operations
 */
async function createSupplierBidInSupabase(bidData) {
  const record = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `BID-${Date.now()}`,
    rfq_hospital_id: bidData.rfqHospitalId || bidData.rfq_hospital_id || 'H004',
    material_id: bidData.materialId || bidData.material_id,
    supplier_id: bidData.supplierId || bidData.supplier_id,
    offered_qty: Number(bidData.offeredQty || bidData.offered_qty || bidData.capacity || 0),
    unit_cost: Number(bidData.unitCost || bidData.unit_cost || bidData.rate || 0),
    currency: bidData.currency || 'INR',
    lead_time_days: Number(bidData.leadTimeDays || bidData.lead_time_days || bidData.leadTime || 1),
    osrm_travel_days: bidData.osrmTravelDays || bidData.osrm_travel_days || null,
    osrm_max_allowed_days: bidData.osrmMaxAllowedDays || bidData.osrm_max_allowed_days || null,
    delay_reason: bidData.delayReason || bidData.delay_reason || '',
    compliance: bidData.compliance || 'Y',
    status: bidData.status || 'OPEN',
    created_at: new Date().toISOString(),
  };

  inMemoryStore.supplier_bids.push(record);

  if (!supabaseAdmin) return record;
  try {
    const { data, error } = await supabaseAdmin
      .from('supplier_bids')
      .insert([record])
      .select()
      .single();

    if (!error && data) return data;
  } catch (e) {
    // Continue with inMemoryStore
  }
  return record;
}

async function getSupplierBidsFromSupabase(filter = {}) {
  let list = inMemoryStore.supplier_bids;

  if (supabaseAdmin) {
    try {
      let query = supabaseAdmin.from('supplier_bids').select('*').order('created_at', { ascending: false });
      if (filter.supplierId || filter.supplier_id) {
        query = query.eq('supplier_id', filter.supplierId || filter.supplier_id);
      }
      if (filter.rfqHospitalId || filter.rfq_hospital_id) {
        query = query.eq('rfq_hospital_id', filter.rfqHospitalId || filter.rfq_hospital_id);
      }
      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch (e) {}
  }

  // Filter in-memory
  return list.filter((b) => {
    if ((filter.supplierId || filter.supplier_id) && b.supplier_id !== (filter.supplierId || filter.supplier_id)) return false;
    if ((filter.rfqHospitalId || filter.rfq_hospital_id) && b.rfq_hospital_id !== (filter.rfqHospitalId || filter.rfq_hospital_id)) return false;
    if (filter.status && b.status !== filter.status) return false;
    return true;
  });
}

async function updateSupplierBidStatusInSupabase(bidId, status) {
  const idx = inMemoryStore.supplier_bids.findIndex((b) => b.id === bidId);
  if (idx >= 0) {
    inMemoryStore.supplier_bids[idx].status = status;
  }

  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from('supplier_bids').update({ status }).eq('id', bidId);
    } catch (e) {}
  }
}

/**
 * 2-Step Shipment Approvals Operations
 */
async function createShipmentApprovalInSupabase(shipmentData) {
  const record = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `SHIP-${Date.now()}`,
    order_type: shipmentData.orderType || shipmentData.order_type || 'HOSPITAL_TRANSFER',
    source_hospital_id: shipmentData.sourceHospitalId || shipmentData.source_hospital_id || null,
    supplier_id: shipmentData.supplierId || shipmentData.supplier_id || null,
    dest_hospital_id: shipmentData.destHospitalId || shipmentData.dest_hospital_id,
    material_id: shipmentData.materialId || shipmentData.material_id,
    qty: Number(shipmentData.qty || 0),
    bid_id: isUUID(shipmentData.bidId || shipmentData.bid_id) ? (shipmentData.bidId || shipmentData.bid_id) : null,
    requested_by_manager_id: isUUID(shipmentData.requestedByManagerId || shipmentData.requested_by_manager_id)
      ? (shipmentData.requestedByManagerId || shipmentData.requested_by_manager_id)
      : null,
    status: shipmentData.status || 'PENDING_DISPATCH',
    dispatch_approved_by: null,
    dispatch_approved_at: null,
    receipt_approved_by: null,
    receipt_approved_at: null,
    sap_dispatch_committed: false,
    sap_receipt_committed: false,
    rejection_note: null,
    review_submitted: false,
    created_at: new Date().toISOString(),
  };

  inMemoryStore.shipment_approvals.push(record);

  if (!supabaseAdmin) return record;
  try {
    const { data, error } = await supabaseAdmin
      .from('shipment_approvals')
      .insert([record])
      .select()
      .single();

    if (!error && data) return data;
  } catch (e) {}
  return record;
}

async function getShipmentApprovalsFromSupabase(filter = {}) {
  let list = inMemoryStore.shipment_approvals;

  if (supabaseAdmin) {
    try {
      let query = supabaseAdmin.from('shipment_approvals').select('*').order('created_at', { ascending: false });
      if (filter.destHospitalId || filter.dest_hospital_id) {
        query = query.eq('dest_hospital_id', filter.destHospitalId || filter.dest_hospital_id);
      }
      if (filter.sourceHospitalId || filter.source_hospital_id) {
        query = query.eq('source_hospital_id', filter.sourceHospitalId || filter.source_hospital_id);
      }
      if (filter.supplierId || filter.supplier_id) {
        query = query.eq('supplier_id', filter.supplierId || filter.supplier_id);
      }
      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch (e) {}
  }

  return list.filter((s) => {
    if ((filter.destHospitalId || filter.dest_hospital_id) && s.dest_hospital_id !== (filter.destHospitalId || filter.dest_hospital_id)) return false;
    if ((filter.sourceHospitalId || filter.source_hospital_id) && s.source_hospital_id !== (filter.sourceHospitalId || filter.source_hospital_id)) return false;
    if ((filter.supplierId || filter.supplier_id) && s.supplier_id !== (filter.supplierId || filter.supplier_id)) return false;
    if (filter.status && s.status !== filter.status) return false;
    return true;
  });
}

async function updateShipmentApprovalInSupabase(id, updates) {
  const idx = inMemoryStore.shipment_approvals.findIndex((s) => s.id === id);
  if (idx >= 0) {
    inMemoryStore.shipment_approvals[idx] = { ...inMemoryStore.shipment_approvals[idx], ...updates };
  }

  if (supabaseAdmin) {
    try {
      const { data } = await supabaseAdmin
        .from('shipment_approvals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (data) return data;
    } catch (e) {}
  }

  return inMemoryStore.shipment_approvals[idx] || null;
}

/**
 * Supplier Reviews Operations
 */
async function createSupplierReviewInSupabase(reviewData) {
  const record = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `REV-${Date.now()}`,
    shipment_id: reviewData.shipmentId || reviewData.shipment_id,
    supplier_id: reviewData.supplierId || reviewData.supplier_id,
    material_id: reviewData.materialId || reviewData.material_id,
    hospital_id: reviewData.hospitalId || reviewData.hospital_id,
    reviewed_by_manager_id: isUUID(reviewData.reviewedByManagerId || reviewData.reviewed_by_manager_id)
      ? (reviewData.reviewedByManagerId || reviewData.reviewed_by_manager_id)
      : null,
    delivery_speed: Number(reviewData.delivery_speed || reviewData.deliverySpeed || 95),
    on_time_rate: Number(reviewData.on_time_rate || reviewData.onTimeRate || 95),
    reliability: Number(reviewData.reliability || reviewData.reliabilityScore || 95),
    quality_score: Number(reviewData.quality_score || reviewData.qualityScore || 95),
    emerg_response: Number(reviewData.emerg_response || reviewData.emergResponse || 95),
    cold_chain_score: Number(reviewData.cold_chain_score || reviewData.coldChainScore || 95),
    fulfilment_rate: Number(reviewData.fulfilment_rate || reviewData.fulfilmentRate || 95),
    doc_cert_score: Number(reviewData.doc_cert_score || reviewData.docCertScore || 95),
    comments: reviewData.comments || '',
    synced_to_sap: Boolean(reviewData.syncedToSap || reviewData.synced_to_sap),
    created_at: new Date().toISOString(),
  };

  inMemoryStore.supplier_reviews.push(record);

  if (!supabaseAdmin) return record;
  try {
    const { data, error } = await supabaseAdmin
      .from('supplier_reviews')
      .insert([record])
      .select()
      .single();

    if (!error && data) return data;
  } catch (e) {}
  return record;
}

async function getSupplierReviewsFromSupabase(filter = {}) {
  let list = inMemoryStore.supplier_reviews;

  if (supabaseAdmin) {
    try {
      let query = supabaseAdmin.from('supplier_reviews').select('*').order('created_at', { ascending: false });
      if (filter.supplierId || filter.supplier_id) {
        query = query.eq('supplier_id', filter.supplierId || filter.supplier_id);
      }
      if (filter.hospitalId || filter.hospital_id) {
        query = query.eq('hospital_id', filter.hospitalId || filter.hospital_id);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch (e) {}
  }

  return list.filter((r) => {
    if ((filter.supplierId || filter.supplier_id) && r.supplier_id !== (filter.supplierId || filter.supplier_id)) return false;
    if ((filter.hospitalId || filter.hospital_id) && r.hospital_id !== (filter.hospitalId || filter.hospital_id)) return false;
    return true;
  });
}

/**
 * Hospital Tasks Operations
 */
async function createHospitalTaskInSupabase(taskData) {
  const record = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `TASK-${Date.now()}`,
    hospital_id: taskData.hospitalId || taskData.hospital_id,
    material_id: taskData.materialId || taskData.material_id || null,
    title: taskData.title,
    description: taskData.description || '',
    priority: taskData.priority || 'MEDIUM',
    status: taskData.status || 'PENDING',
    assigned_to: isUUID(taskData.assignedTo || taskData.assigned_to) ? (taskData.assignedTo || taskData.assigned_to) : null,
    created_by: isUUID(taskData.createdBy || taskData.created_by) ? (taskData.createdBy || taskData.created_by) : null,
    due_date: taskData.dueDate || taskData.due_date || null,
    created_at: new Date().toISOString(),
  };

  inMemoryStore.hospital_tasks.push(record);

  if (!supabaseAdmin) return record;
  try {
    const { data, error } = await supabaseAdmin
      .from('hospital_tasks')
      .insert([record])
      .select()
      .single();

    if (!error && data) return data;
  } catch (e) {}
  return record;
}

async function getHospitalTasksFromSupabase(hospitalId) {
  let list = inMemoryStore.hospital_tasks;

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('hospital_tasks')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {}
  }

  return list.filter((t) => !hospitalId || t.hospital_id === hospitalId);
}

module.exports = {
  supabaseAdmin,
  isSupabaseConfigured,
  SUPABASE_URL,
  isUUID,
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
  inMemoryStore,
};
