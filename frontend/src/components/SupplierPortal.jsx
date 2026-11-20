import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { usePulseChain } from '../context/PulseChainContext';
import {
  Truck,
  Package,
  Clock,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  Send,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Building2,
  Layers,
  ArrowRight,
  TrendingUp,
  XCircle,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function SupplierPortal() {
  const { user, openShortages, fetchOpenShortages, fetchSuppliers } = usePulseChain();

  const assignedSupplierId = user?.supplierId || 'V1001';

  // Proposal Form State
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [unitCost, setUnitCost] = useState(85);
  const [leadTime, setLeadTime] = useState(2);
  const [capacity, setCapacity] = useState(6000);
  const [compliance, setCompliance] = useState('Y');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [myBids, setMyBids] = useState([]);

  // Fetch bids submitted by this supplier
  const fetchMyBids = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/supplier-bids/${assignedSupplierId}`);
      setMyBids(response.data.data || []);
    } catch (err) {
      console.error('Failed to load supplier bids:', err);
    }
  };

  useEffect(() => {
    fetchMyBids();
    if (openShortages.length > 0 && !selectedMaterial) {
      setSelectedMaterial(openShortages[0].materialId);
    }
  }, [openShortages]);

  // Handle selecting an RFQ from the table to bid on
  const handleSelectRfq = (rfq) => {
    setSelectedMaterial(rfq.materialId);
    setSubmitResult(null);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Submit Bid
  const handleSubmitBid = async (e) => {
    e.preventDefault();
    if (!selectedMaterial) return;
    setSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/supplier-bid`, {
        supplierId: assignedSupplierId,
        materialId: selectedMaterial,
        unitCost: parseFloat(unitCost),
        leadTime: parseFloat(leadTime),
        capacity: parseFloat(capacity),
        compliance: compliance,
      });

      if (response.data.success) {
        setSubmitResult({
          type: 'success',
          message: 'Proposal successfully logged in SAP Procurement Ledger (Z_PULSE_SUBMIT_BID)!',
          bid: response.data.bid,
        });

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
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Top Banner: Supplier Profile */}
      <div className="glass-panel p-5 rounded-3xl border border-[#e0e8e2]/15 bg-gradient-to-r from-[#2c2e35]/95 via-[#2a3f3f]/85 to-[#2c2e35]/95 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-[#467750]/30 border border-[#89c07e]/40 text-[#89c07e]">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Emergency Supplier Bidding Portal
                </h2>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#89c07e] text-[#2c2e35]">
                  SAP ET_SUPPLIERS
                </span>
              </div>
              <p className="text-xs text-[#e0e8e2]/70 font-mono mt-0.5">
                Vendor: <strong className="text-white">{assignedSupplierId} (BioPharm Logistics)</strong> • Commercial Rep:{' '}
                <strong className="text-[#89c07e]">{user?.name || 'Saumay Dubey'}</strong> • SLA:{' '}
                <strong className="text-[#89c07e]">98%</strong> • Quality:{' '}
                <strong className="text-[#89c07e]">GAMP Cold-Chain Certified</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start md:self-center">
            <button
              onClick={() => {
                fetchOpenShortages();
                fetchMyBids();
              }}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-mono bg-[#2a3f3f]/60 border border-[#e0e8e2]/15 text-[#e0e8e2] hover:border-[#89c07e]/50 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#89c07e]" />
              <span>Refresh RFQs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Active Emergency RFQs, Right = Submit Proposal Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Emergency RFQs (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-5 rounded-3xl border border-[#e0e8e2]/15 bg-[#2c2e35]/85 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e0e8e2]/10 pb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-[#f0cd6e]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Active Emergency RFQs (Network Shortages)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f0cd6e]/20 text-[#f0cd6e] border border-[#f0cd6e]/30 font-bold">
                {openShortages.length} Shortages Pending
              </span>
            </div>

            <p className="text-xs text-[#e0e8e2]/70">
              The following hospitals are operating under critical reserve (&lt; 5 days cover). Click <strong>Quote RFQ</strong> to formulate a commercial proposal.
            </p>

            <div className="space-y-2.5">
              {openShortages.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#e0e8e2]/50 font-mono">
                  No active emergency RFQs at this time. All regional facilities are stocked.
                </div>
              ) : (
                openShortages.map((rfq) => {
                  const isSelected = rfq.materialId === selectedMaterial;

                  return (
                    <div
                      key={`${rfq.hospitalId}-${rfq.materialId}`}
                      onClick={() => handleSelectRfq(rfq)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#89c07e] bg-gradient-to-r from-[#467750]/30 to-[#2c2e35] shadow-lg ring-1 ring-[#89c07e]/50'
                          : 'border-[#e0e8e2]/10 bg-[#2a3f3f]/40 hover:border-[#89c07e]/40'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-base font-bold text-white font-mono">
                              {rfq.materialId}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2a3f3f] text-[#f0cd6e] border border-[#f0cd6e]/30">
                              {rfq.hospitalId} ({rfq.city})
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/40 font-mono">
                              {rfq.daysCover}d Cover
                            </span>
                          </div>

                          <div className="text-xs text-[#e0e8e2]/70 flex items-center space-x-3 font-mono">
                            <span>Daily Burn: <strong>{rfq.dailyUse} {rfq.unit}/day</strong></span>
                            <span>•</span>
                            <span>Target Buffer: <strong className="text-[#89c07e]">+{rfq.dailyUse * 5} {rfq.unit}</strong></span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectRfq(rfq);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                            isSelected
                              ? 'bg-[#89c07e] text-slate-950'
                              : 'bg-[#2a3f3f] text-[#e0e8e2] hover:text-white border border-[#e0e8e2]/15'
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

          {/* Submitted Bids Table */}
          {myBids.length > 0 && (
            <div className="glass-panel p-5 rounded-3xl border border-[#e0e8e2]/15 bg-[#2c2e35]/85 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-[#e0e8e2]/10 pb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-1.5 font-mono">
                  <Layers className="w-3.5 h-3.5 text-[#89c07e]" />
                  <span>My Active Submitted Proposals ({myBids.length})</span>
                </h4>
                <span className="text-[10px] font-mono text-[#89c07e]">
                  Visible in Manager Screen 3 Option B
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#e0e8e2]/10 text-[#e0e8e2]/50 text-[10px] uppercase">
                      <th className="py-2 px-3">Medicine</th>
                      <th className="py-2 px-3 text-right">Unit Rate</th>
                      <th className="py-2 px-3 text-center">Lead Time</th>
                      <th className="py-2 px-3 text-center">Cold-Chain</th>
                      <th className="py-2 px-3 text-center">ERP Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0e8e2]/10">
                    {myBids.map((bid) => (
                      <tr key={bid.id} className="hover:bg-[#2a3f3f]/30">
                        <td className="py-2.5 px-3 font-bold text-white">
                          {bid.materialId}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#89c07e]">
                          ₹{bid.unitCost} /unit
                        </td>
                        <td className="py-2.5 px-3 text-center text-[#f0cd6e]">
                          {bid.leadTime} Days
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {bid.compliance === 'Y' ? (
                            <span className="text-[10px] text-[#89c07e] font-medium inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-[#89c07e]" />
                              <span>Certified</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-red-400 font-medium inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                              <span>Non-Compliant</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#467750]/30 text-[#89c07e] border border-[#89c07e]/30">
                            SAP COMMITTED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Submit Proposal Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-[#e0e8e2]/15 bg-[#2c2e35]/90 shadow-2xl space-y-5">
            <div className="border-b border-[#e0e8e2]/10 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Submit Emergency Supply Proposal
                </h3>
                <p className="text-[11px] text-[#e0e8e2]/60 font-mono">
                  Commit price and velocity to SAP S/4HANA RFQ ledger
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-[#89c07e] px-2 py-0.5 rounded bg-[#467750]/30 border border-[#89c07e]/40">
                {assignedSupplierId}
              </span>
            </div>

            {/* Submission Status */}
            {submitResult && (
              <div
                className={`p-3.5 rounded-2xl border text-xs flex items-start space-x-2.5 animate-in fade-in ${
                  submitResult.type === 'success'
                    ? 'bg-[#467750]/30 border-[#89c07e]/50 text-[#e0e8e2]'
                    : 'bg-red-950/80 border-red-500/50 text-red-200'
                }`}
              >
                {submitResult.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#89c07e] shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold">{submitResult.message}</div>
                  <div className="text-[10px] text-[#89c07e]">
                    Quote will appear directly under Screen 3 (Recovery Planning: Option B) for the Inventory Manager!
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitBid} className="space-y-4">
              {/* Material Selector */}
              <div>
                <label className="block text-xs font-mono uppercase text-[#e0e8e2]/70 mb-1.5 font-bold">
                  Target Shortage Medicine
                </label>
                <select
                  value={selectedMaterial}
                  onChange={(e) => setSelectedMaterial(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#2a3f3f]/60 border border-[#e0e8e2]/15 text-xs text-white focus:outline-none focus:border-[#89c07e]/60 font-mono"
                >
                  <option value="">Select an active RFQ...</option>
                  {openShortages.map((rfq) => (
                    <option key={rfq.materialId} value={rfq.materialId}>
                      {rfq.materialId} — {rfq.hospitalId} ({rfq.city}) [{rfq.daysCover}d cover remaining]
                    </option>
                  ))}
                  <option value="INS001">INS001 (Human Insulin)</option>
                  <option value="AMX002">AMX002 (Amoxicillin)</option>
                  <option value="PROP003">PROP003 (Propofol)</option>
                  <option value="HEP004">HEP004 (Heparin Sodium)</option>
                  <option value="SAL005">SAL005 (0.9% Normal Saline)</option>
                </select>
              </div>

              {/* Proposed Unit Rate */}
              <div>
                <label className="block text-xs font-mono uppercase text-[#e0e8e2]/70 mb-1.5 font-medium">
                  Proposed Unit Price (₹ / INR)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#89c07e]" />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#2a3f3f]/60 border border-[#e0e8e2]/15 text-base font-bold text-white focus:outline-none focus:border-[#89c07e]/60 font-mono"
                  />
                </div>
              </div>

              {/* Delivery Lead Time */}
              <div>
                <label className="block text-xs font-mono uppercase text-[#e0e8e2]/70 mb-1.5 font-bold">
                  Promised Delivery Lead Time (Days)
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#f0cd6e]" />
                  <input
                    type="number"
                    min="1"
                    max="14"
                    step="1"
                    required
                    value={leadTime}
                    onChange={(e) => setLeadTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#2a3f3f]/60 border border-[#e0e8e2]/15 text-sm font-bold text-white focus:outline-none focus:border-[#89c07e]/60 font-mono"
                  />
                </div>
              </div>

              {/* Available Capacity */}
              <div>
                <label className="block text-xs font-mono uppercase text-[#e0e8e2]/70 mb-1.5 font-bold">
                  Available Reserve Capacity (Units)
                </label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#2a3f3f]/60 border border-[#e0e8e2]/15 text-sm font-bold text-white focus:outline-none focus:border-[#89c07e]/60 font-mono"
                />
              </div>

              {/* Cold-Chain Compliance Verified Toggle */}
              <div className="p-3.5 rounded-2xl bg-[#2a3f3f]/50 border border-[#e0e8e2]/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#89c07e]" />
                    Cold-Chain Compliance (GAMP/FDA)
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setCompliance('Y')}
                      className={`px-3 py-1 rounded-xl text-xs font-mono font-medium flex items-center gap-1 transition-all ${
                        compliance === 'Y'
                          ? 'bg-[#89c07e] text-slate-950 font-bold'
                          : 'bg-[#2a3f3f] text-[#e0e8e2]/60'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Yes (Y)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompliance('N')}
                      className={`px-3 py-1 rounded-xl text-xs font-mono font-medium flex items-center gap-1 transition-all ${
                        compliance === 'N'
                          ? 'bg-red-500 text-white font-bold'
                          : 'bg-[#2a3f3f] text-[#e0e8e2]/60'
                      }`}
                    >
                      <XCircle className="w-3 h-3" />
                      <span>No (N)</span>
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-[#e0e8e2]/60 font-mono">
                  {compliance === 'Y'
                    ? 'Verified cold-chain transit containers with continuous IoT data logging.'
                    : 'Non-compliant submissions will be rejected by the Compliance Agent.'}
                </p>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting || !selectedMaterial}
                className="w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-slate-950 shadow-lg shadow-orange-500/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {submitting ? (
                  <span>Recording in SAP RFQ Ledger...</span>
                ) : (
                  <>
                    <span>Submit Proposal to SAP RFQ Ledger</span>
                    <Send className="w-3.5 h-3.5 text-slate-950" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
