import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { usePulseChain } from '../context/PulseChainContext';
import DeliveryRouteMap from './DeliveryRouteMap';
import CopyButton from './common/CopyButton';
import ConfirmModal from './common/ConfirmModal';
import {
  Truck,
  Package,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Send,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Building2,
  ArrowRight,
  MapPin,
  Navigation,
} from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api';

export default function SupplierPortal() {
  const { user, openShortages, fetchOpenShortages, fetchSuppliers } = usePulseChain();

  const assignedSupplierId = user?.supplierId || user?.supplier_id || 'V1001';

  // Proposal Form State
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [targetHospitalId, setTargetHospitalId] = useState('H004');
  const [unitCost, setUnitCost] = useState(85);
  const [leadTime, setLeadTime] = useState(2);
  const [capacity, setCapacity] = useState(6000);
  const [compliance, setCompliance] = useState('Y');
  const [delayReason, setDelayReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [myBids, setMyBids] = useState([]);
  const [supplierSapMetrics, setSupplierSapMetrics] = useState(null);

  // ConfirmModal State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Fetch supplier SAP metrics
  const fetchSupplierSapMetrics = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/suppliers`);
      if (res.data?.success && res.data.data) {
        const found = res.data.data.find(
          (s) => (s.SUPPLIER_ID || s.supplierId) === assignedSupplierId
        );
        if (found) {
          setSupplierSapMetrics(found);
        }
      }
    } catch (err) {
      console.warn('Failed to load supplier SAP metrics:', err.message);
    }
  };

  // OSRM Route & +1 Day Guardrail State
  const [routeInfo, setRouteInfo] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Fetch bids submitted by this supplier
  const fetchMyBids = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/supplier-bids/${assignedSupplierId}`);
      setMyBids(response.data.data || []);
    } catch (err) {
      console.error('Failed to load supplier bids:', err);
    }
  };

  // Fetch route between this supplier and the target hospital
  const fetchRoute = async (hId) => {
    const dest = hId || targetHospitalId || 'H004';
    setLoadingRoute(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/route/${assignedSupplierId}/${dest}`);
      if (res.data?.success && res.data.route) {
        setRouteInfo(res.data.route);
      }
    } catch (err) {
      console.warn('Route lookup error:', err.message);
    } finally {
      setLoadingRoute(false);
    }
  };

  useEffect(() => {
    fetchMyBids();
    fetchSupplierSapMetrics();
    if (openShortages.length > 0 && !selectedMaterial) {
      setSelectedMaterial(openShortages[0].materialId);
      setTargetHospitalId(openShortages[0].hospitalId || 'H004');
      fetchRoute(openShortages[0].hospitalId || 'H004');
    } else {
      fetchRoute(targetHospitalId);
    }
  }, [openShortages]);

  // Handle selecting an RFQ from the table to bid on
  const handleSelectRfq = (rfq) => {
    setSelectedMaterial(rfq.materialId);
    setTargetHospitalId(rfq.hospitalId || 'H004');
    fetchRoute(rfq.hospitalId || 'H004');
    setSubmitResult(null);
  };

  // Calculate Max Allowed Lead Days from OSRM Duration: durationHours / 24 + 1
  const maxAllowedLeadDays = useMemo(() => {
    if (!routeInfo) return 2;
    return Math.ceil((routeInfo.durationHours || 0) / 24) + 1;
  }, [routeInfo]);

  const isDelayExceeded = Number(leadTime) > maxAllowedLeadDays;
  const isDelayReasonValid = !isDelayExceeded || (delayReason && delayReason.trim().length >= 5);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!selectedMaterial) return;

    if (isDelayExceeded && !isDelayReasonValid) {
      setSubmitResult({
        type: 'error',
        message: `Proposed lead time (${leadTime}d) exceeds maximum allowable transit duration (${maxAllowedLeadDays}d). Mandatory delay justification (minimum 5 characters) is required.`,
      });
      return;
    }

    setConfirmModalOpen(true);
  };

  // Execute Submit Bid after Confirmation
  const executeSubmitBid = async () => {
    setSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/supplier-bid`, {
        supplierId: assignedSupplierId,
        materialId: selectedMaterial,
        hospitalId: targetHospitalId,
        unitCost: parseFloat(unitCost),
        leadTime: parseFloat(leadTime),
        capacity: parseFloat(capacity),
        compliance: compliance,
        delayReason: isDelayExceeded ? delayReason.trim() : null,
      });

      if (response.data.success) {
        setSubmitResult({
          type: 'success',
          message: 'Proposal successfully recorded in SAP Procurement Ledger (Z_PULSE_SUBMIT_BID)!',
          bid: response.data.bid,
        });

        setDelayReason('');
        await fetchMyBids();
        await fetchSuppliers();
      }
    } catch (err) {
      setSubmitResult({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit proposal',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto text-abyss-text font-sans">
      {/* Top Bento Header: Supplier Profile */}
      <div className="rounded-xl bg-abyss-card border border-sand-border p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-xl bg-abyss-elevated border border-sand-border text-volt">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-black text-abyss-text tracking-tight">
                  Emergency Supplier Bidding Portal
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-volt text-volt-text">
                  SAP ET_SUPPLIERS
                </span>
              </div>
              <p className="text-xs text-abyss-muted font-mono mt-0.5">
                Vendor: <strong className="text-abyss-text">{assignedSupplierId} (BioPharm Logistics)</strong> • Commercial Rep:{' '}
                <strong className="text-volt">{user?.name || 'Saumay Dubey'}</strong> • SLA:{' '}
                <strong className="text-abyss-text">98%</strong> • Quality:{' '}
                <strong className="text-abyss-text">GAMP Cold-Chain Certified</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start md:self-center">
            <button
              type="button"
              onClick={() => {
                fetchOpenShortages();
                fetchMyBids();
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono bg-abyss-elevated border border-sand-border text-abyss-text hover:border-volt transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-volt" />
              <span>Refresh RFQs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live SAP HANA Trust Score Bento Card (Zero React Math) */}
      <div className="rounded-xl bg-abyss-card border border-sand-border p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sand-border pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-volt" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-abyss-text flex items-center gap-2">
                <span>SAP HANA Computed Supplier Scorecard: {assignedSupplierId}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sand-base text-sand-text font-bold">
                  Calculated natively in SAP HANA
                </span>
              </h3>
              <p className="text-xs text-abyss-muted font-mono mt-0.5">
                Single Source of Truth for Enterprise Trust Score, Tier Classification, and Eligibility
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="text-volt font-bold">
              Trust Score: {supplierSapMetrics?.TRUST_SCORE ?? 95.0} / 100
            </span>
            <span className="px-2 py-0.5 rounded bg-volt text-volt-text font-bold">
              {supplierSapMetrics?.SUPPLIER_TIER || 'PLATINUM'} TIER
            </span>
            <span className="px-2 py-0.5 rounded bg-sand-base text-sand-text font-bold">
              {supplierSapMetrics?.IS_ELIGIBLE !== false ? 'ELIGIBLE' : 'BLOCKED'}
            </span>
          </div>
        </div>

        {/* 8 Performance Factors Progress Bars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
          {[
            { label: 'Delivery Speed (35%)', val: supplierSapMetrics?.DELIVERY_SPEED ?? 92 },
            { label: 'On-Time Rate', val: supplierSapMetrics?.ON_TIME_RATE ?? 95 },
            { label: 'Reliability', val: supplierSapMetrics?.RELIABILITY ?? 90 },
            { label: 'Quality Score', val: supplierSapMetrics?.QUALITY_SCORE ?? 98 },
            { label: 'Emergency Resp', val: supplierSapMetrics?.EMERG_RESPONSE ?? 88 },
            { label: 'Cold-Chain Score', val: supplierSapMetrics?.COLD_CHAIN_SCORE ?? 96 },
            { label: 'Fulfilment Rate', val: supplierSapMetrics?.FULFILMENT_RATE ?? 94 },
            { label: 'Doc & Cert Score', val: supplierSapMetrics?.DOC_CERT_SCORE ?? 92 },
          ].map((item) => (
            <div key={item.label} className="p-2.5 rounded-lg bg-abyss-elevated border border-sand-border space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-abyss-muted">
                <span className="truncate">{item.label}</span>
                <span className="font-bold text-abyss-text text-xs">{item.val}</span>
              </div>
              <div className="w-full h-1.5 bg-abyss-canvas rounded-full overflow-hidden">
                <div
                  className="h-full bg-volt rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, item.val)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Left = Active Emergency RFQs, Right = Submit Proposal Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Active Emergency RFQs (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl bg-abyss-card border border-sand-border p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-sand-border pb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-volt" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-abyss-text">
                  Active Emergency RFQs (Network Shortages)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-volt text-volt-text font-bold">
                {openShortages.length} Shortages Pending
              </span>
            </div>

            <p className="text-xs text-abyss-muted">
              Select an urgent requirement to inspect route logistics and generate a proposal.
            </p>

            <div className="space-y-2.5">
              {openShortages.length === 0 ? (
                <div className="p-8 text-center text-xs text-abyss-muted font-mono">
                  No active emergency RFQs at this time. All regional facilities are adequately stocked.
                </div>
              ) : (
                openShortages.map((rfq) => {
                  const isSelected = rfq.materialId === selectedMaterial;

                  return (
                    <div
                      key={`${rfq.hospitalId}-${rfq.materialId}`}
                      onClick={() => handleSelectRfq(rfq)}
                      className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-volt bg-abyss-elevated shadow-sm'
                          : 'border-sand-border bg-abyss-card hover:border-abyss-border'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-base font-bold text-abyss-text font-mono">
                              {rfq.materialId}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-abyss-elevated text-abyss-text border border-sand-border">
                              {rfq.hospitalId} ({rfq.city})
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-volt text-volt-text font-mono">
                              {rfq.daysCover}d Cover
                            </span>
                          </div>

                          <div className="text-xs text-abyss-muted flex items-center space-x-3 font-mono">
                            <span>Daily Burn: <strong>{rfq.dailyUse} {rfq.unit}/day</strong></span>
                            <span>•</span>
                            <span>Target Buffer: <strong className="text-volt">+{rfq.dailyUse * 5} {rfq.unit}</strong></span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectRfq(rfq);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                            isSelected
                              ? 'bg-volt text-volt-text'
                              : 'bg-abyss-elevated text-abyss-text hover:bg-sand-border/30 border border-sand-border'
                          }`}
                        >
                          <span>{isSelected ? 'Active Target' : 'Quote RFQ'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Live OSRM Delivery Route Map */}
          <div className="rounded-xl bg-abyss-card border border-sand-border p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-sand-border pb-2">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-abyss-text">
                <Navigation className="w-4 h-4 text-volt" />
                <span>Transit Route: {assignedSupplierId} ➔ {targetHospitalId}</span>
              </div>
              <span className="text-[10px] font-mono text-abyss-muted">
                {routeInfo?.distanceKm ? `${routeInfo.distanceKm} km • ~${routeInfo.durationHours}h drive` : 'Calculating route...'}
              </span>
            </div>

            <div className="overflow-hidden rounded-lg border border-sand-border">
              <DeliveryRouteMap
                route={routeInfo}
                originName={`${assignedSupplierId} Central Depot`}
                destName={`Hospital ${targetHospitalId}`}
                height="260px"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Submit Proposal Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl bg-abyss-card border border-sand-border p-5 shadow-sm space-y-4">
            <div className="border-b border-sand-border pb-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-volt block">
                Official Tender Form
              </span>
              <h3 className="text-base font-bold text-abyss-text tracking-tight mt-0.5">
                Submit Emergency Proposal
              </h3>
              <p className="text-xs text-abyss-muted font-mono mt-0.5">
                Quotes are written live into SAP Procurement Ledger (Z_PULSE_SUBMIT_BID).
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[11px] text-abyss-muted mb-1 font-bold">Target Material ID</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    required
                    readOnly
                    value={selectedMaterial}
                    className="w-full px-3 py-2 rounded-lg bg-abyss-elevated border border-sand-border text-volt font-bold"
                  />
                  {selectedMaterial && <CopyButton text={selectedMaterial} label="Copy Material ID" />}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-abyss-muted mb-1 font-bold">Target Hospital</label>
                  <input
                    type="text"
                    required
                    readOnly
                    value={targetHospitalId}
                    className="w-full px-3 py-2 rounded-lg bg-abyss-elevated border border-sand-border text-abyss-text font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-abyss-muted mb-1 font-bold">Cold-Chain Compliant</label>
                  <select
                    value={compliance}
                    onChange={(e) => setCompliance(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-abyss-elevated border border-sand-border text-abyss-text focus:outline-none focus:border-volt"
                  >
                    <option value="Y">Compliant (Validated)</option>
                    <option value="N">Non-Compliant</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-abyss-muted mb-1 font-bold">Offered Unit Rate (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-abyss-elevated border border-sand-border text-abyss-text focus:outline-none focus:border-volt font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-abyss-muted mb-1 font-bold">Committed Quantity</label>
                  <input
                    type="number"
                    required
                    min="100"
                    step="50"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-abyss-elevated border border-sand-border text-abyss-text focus:outline-none focus:border-volt"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] text-abyss-muted font-bold">
                    Delivery Lead Time (Days)
                  </label>
                  <span className="text-[10px] text-volt">
                    Max Allowed: {maxAllowedLeadDays}d (+1 Day Rule)
                  </span>
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  max="30"
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg bg-abyss-elevated border text-abyss-text focus:outline-none font-bold ${
                    isDelayExceeded ? 'border-volt text-volt' : 'border-sand-border focus:border-volt'
                  }`}
                />
              </div>

              {/* OSRM Travel Time + 1 Day Guardrail Exceeded Trigger */}
              {isDelayExceeded && (
                <div className="p-3 rounded-lg bg-abyss-elevated border border-volt/60 space-y-2">
                  <div className="flex items-center space-x-2 text-volt text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Road Velocity Guardrail Triggered</span>
                  </div>
                  <p className="text-[11px] text-abyss-muted leading-relaxed">
                    Transit duration exceeds maximum permitted lead time ({maxAllowedLeadDays} days). A mandatory delay reason is required for SAP audit.
                  </p>
                  <div>
                    <label className="block text-[10px] uppercase text-volt mb-1 font-bold">
                      Mandatory Delay Justification Reason
                    </label>
                    <textarea
                      required
                      rows="2"
                      value={delayReason}
                      onChange={(e) => setDelayReason(e.target.value)}
                      placeholder="e.g. Cold-chain vehicle maintenance inspection on NH-46 corridor"
                      className="w-full px-2.5 py-1.5 rounded bg-abyss-card border border-sand-border text-xs text-abyss-text focus:outline-none focus:border-volt"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-volt text-volt-text font-bold text-xs uppercase tracking-wide hover:bg-volt-hover active:scale-[0.99] transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#FFD400]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Transmitting to SAP Gateway...' : 'Submit Proposal to SAP'}</span>
              </button>
            </form>

            {submitResult && (
              <div
                className={`p-3 rounded-lg border text-xs font-mono ${
                  submitResult.type === 'success'
                    ? 'bg-sand-base text-sand-text border-sand-border'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                <div className="font-bold">{submitResult.message}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Bid Submission */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        title="Authorize SAP Proposal Submission"
        message={`Authorize proposal submission to hospital ${targetHospitalId} for ${capacity} units of ${selectedMaterial} at ₹${unitCost}/unit? Lead time: ${leadTime} days.`}
        confirmLabel="Authorize Proposal"
        cancelLabel="Cancel"
        isDestructive={false}
        onConfirm={executeSubmitBid}
        onClose={() => setConfirmModalOpen(false)}
      />
    </div>
  );
}
