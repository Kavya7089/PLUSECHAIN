import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { usePulseChain } from '../context/PulseChainContext';
import {
  Building2,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  RefreshCw,
  Mail,
  ShieldAlert,
  ClipboardList,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Activity,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function ShopkeeperPortal() {
  const { user, inventory, fetchInventory } = usePulseChain();

  const assignedHospitalId = user?.hospitalId || 'H004';
  const assignedCity = user?.city || 'BHOPAL';

  // Filter inventory strictly for assigned facility (H004)
  const facilityInventory = useMemo(() => {
    return inventory.filter((item) => item.HOSPITAL_ID === assignedHospitalId);
  }, [inventory, assignedHospitalId]);

  // Form state
  const [selectedMaterial, setSelectedMaterial] = useState('AMX002');
  const [stockQty, setStockQty] = useState(110);
  const [dailyUse, setDailyUse] = useState(45);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [recentAudits, setRecentAudits] = useState([]);

  // Calculate live days of cover as user types
  const liveDaysCover = useMemo(() => {
    const s = parseFloat(stockQty);
    const d = parseFloat(dailyUse);
    if (isNaN(s) || isNaN(d) || d <= 0) return 0;
    return Math.floor(s / d);
  }, [stockQty, dailyUse]);

  const isCriticalDeficit = liveDaysCover < 5;

  // Handle selecting an item from the table
  const handleSelectItem = (item) => {
    setSelectedMaterial(item.MATERIAL_ID);
    setStockQty(item.STOCK_QTY);
    setDailyUse(item.DAILY_USE);
    setSubmitResult(null);
  };

  // Submit physical count to SAP
  const handleSubmitCount = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/stock-count`, {
        hospitalId: assignedHospitalId,
        materialId: selectedMaterial,
        stockQty: parseFloat(stockQty),
        dailyUse: parseFloat(dailyUse),
      });

      if (response.data.success) {
        setSubmitResult({
          type: 'success',
          message: response.data.message,
          data: response.data.data,
          sapRecorded: response.data.sapRecorded,
        });

        // Add to audit list
        setRecentAudits((prev) => [
          {
            id: response.data.data.auditLogId || `CNT-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            materialId: selectedMaterial,
            stockQty: parseFloat(stockQty),
            dailyUse: parseFloat(dailyUse),
            daysCover: liveDaysCover,
            alertTriggered: response.data.data.shortageAlertTriggered,
          },
          ...prev,
        ]);

        await fetchInventory();
      }
    } catch (err) {
      setSubmitResult({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit stock count to SAP',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Top Banner: Facility Identity */}
      <div className="glass-panel p-5 rounded-3xl border border-[#e0e8e2]/15 bg-gradient-to-r from-[#2c2e35]/95 via-[#2a3f3f]/85 to-[#2c2e35]/95 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-[#f0cd6e]/20 border border-[#f0cd6e]/40 text-[#f0cd6e]">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Hospital Stock Audit Portal
                </h2>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#f0cd6e] text-[#2c2e35]">
                  SAP MM-IM AUDIT
                </span>
              </div>
              <p className="text-xs text-[#e0e8e2]/70 font-mono mt-0.5">
                Assigned Facility: <strong className="text-white">{assignedHospitalId} (Bhopal Apex Care)</strong> • City:{' '}
                <strong className="text-[#f0cd6e]">{assignedCity}</strong> • Auditor:{' '}
                <strong className="text-[#89c07e]">{user?.name}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-start md:self-center">
            <button
              onClick={fetchInventory}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-mono bg-[#2a3f3f]/60 border border-[#e0e8e2]/15 text-[#e0e8e2] hover:border-[#89c07e]/50 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#89c07e]" />
              <span>Refresh Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Facility Inventory List, Right = Physical Count Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: H004 Inventory Ledger (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-5 rounded-3xl border border-[#e0e8e2]/15 bg-[#2c2e35]/85 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e0e8e2]/10 pb-3">
              <div className="flex items-center space-x-2">
                <ClipboardList className="w-4 h-4 text-[#89c07e]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Hospital H004 Live Stock Ledger
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#e0e8e2]/60">
                Click a row to audit
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#e0e8e2]/10 text-[#e0e8e2]/50 text-[10px] uppercase">
                    <th className="py-2.5 px-3">Medicine ID</th>
                    <th className="py-2.5 px-3 text-right">Physical Stock</th>
                    <th className="py-2.5 px-3 text-right">Daily Burn</th>
                    <th className="py-2.5 px-3 text-center">Days Cover</th>
                    <th className="py-2.5 px-3 text-center">Audit Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e8e2]/10">
                  {facilityInventory.map((item) => {
                    const isDeficit = item.daysCover < 5;
                    const isSelected = item.MATERIAL_ID === selectedMaterial;

                    return (
                      <tr
                        key={item.MATERIAL_ID}
                        onClick={() => handleSelectItem(item)}
                        className={`cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#2a3f3f]/90 border-l-2 border-[#f0cd6e]'
                            : 'hover:bg-[#2a3f3f]/40'
                        } ${isDeficit ? 'bg-red-950/20' : ''}`}
                      >
                        <td className="py-3 px-3">
                          <div className="font-bold text-white flex items-center space-x-1.5 font-sans">
                            <Package className="w-3.5 h-3.5 text-[#89c07e]" />
                            <span>{item.MATERIAL_ID}</span>
                          </div>
                          <span className="text-[10px] text-[#e0e8e2]/50 font-mono">
                            {item.UNIT}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right font-black text-sm text-white">
                          {item.STOCK_QTY.toLocaleString()}
                        </td>

                        <td className="py-3 px-3 text-right text-[#e0e8e2]/70">
                          {item.DAILY_USE} /day
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-black ${
                              isDeficit
                                ? 'bg-red-950/80 text-red-300 border border-red-500/50'
                                : 'bg-[#467750]/30 text-[#89c07e] border border-[#89c07e]/30'
                            }`}
                          >
                            {item.daysCover} Days
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          {isDeficit ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] text-red-400 font-bold">
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                              <span>Shortage</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-[10px] text-[#89c07e] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-[#89c07e]" />
                              <span>Adequate</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectItem(item);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-sans transition-all ${
                              isSelected
                                ? 'bg-[#f0cd6e] text-slate-950 font-black'
                                : 'bg-[#2a3f3f] text-[#e0e8e2] hover:text-white'
                            }`}
                          >
                            {isSelected ? 'Editing' : 'Count'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit History Log */}
          {recentAudits.length > 0 && (
            <div className="glass-panel p-4 rounded-3xl border border-[#e0e8e2]/15 bg-[#2c2e35]/70 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#e0e8e2]/80 flex items-center space-x-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-[#f0cd6e]" />
                <span>Recent Count Submissions for Hospital H004</span>
              </h4>
              <div className="space-y-1.5">
                {recentAudits.slice(0, 3).map((audit) => (
                  <div
                    key={audit.id}
                    className="p-2.5 rounded-xl bg-[#2a3f3f]/50 border border-[#e0e8e2]/10 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <span className="font-bold text-white">{audit.materialId}</span> • Stock:{' '}
                      <span className="text-[#89c07e]">{audit.stockQty}</span> • Daily:{' '}
                      <span className="text-[#e0e8e2]/70">{audit.dailyUse}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          audit.daysCover < 5
                            ? 'bg-red-950 text-red-300 border border-red-500/40'
                            : 'bg-[#467750]/30 text-[#89c07e]'
                        }`}
                      >
                        {audit.daysCover}d Cover
                      </span>
                      {audit.alertTriggered && (
                        <span className="text-[10px] text-[#f0cd6e] flex items-center gap-1 font-bold">
                          <Mail className="w-3 h-3 text-[#f0cd6e]" /> Dual Emails Dispatched
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Physical Stock Count Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-[#e0e8e2]/15 bg-[#2c2e35]/90 shadow-2xl space-y-5">
            <div className="border-b border-[#e0e8e2]/10 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Physical Stock Count Audit
                </h3>
                <p className="text-[11px] text-[#e0e8e2]/60 font-mono">
                  Sync physical shelf counts directly into SAP RFC
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-[#89c07e] px-2 py-0.5 rounded bg-[#467750]/30 border border-[#89c07e]/40">
                H004 - BHOPAL
              </span>
            </div>

            {/* Submission Result Toast */}
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
                <div>
                  <div className="font-bold">{submitResult.message}</div>
                  {submitResult.data?.shortageAlertTriggered && (
                    <div className="text-[11px] text-[#f0cd6e] mt-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span>Alerts sent to manager@pulsechain.com & supplier@pulsechain.com</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitCount} className="space-y-4">
              {/* Select Material */}
              <div>
                <label className="block text-xs font-mono uppercase text-[#e0e8e2]/70 mb-1.5 font-bold">
                  Medicine / Material Item
                </label>
                <select
                  value={selectedMaterial}
                  onChange={(e) => setSelectedMaterial(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#2a3f3f]/60 border border-[#e0e8e2]/15 text-xs text-white focus:outline-none focus:border-[#89c07e]/60 font-mono"
                >
                  {facilityInventory.map((item) => (
                    <option key={item.MATERIAL_ID} value={item.MATERIAL_ID}>
                      {item.MATERIAL_ID} ({item.UNIT}) - Currently {item.STOCK_QTY} on hand
                    </option>
                  ))}
                </select>
              </div>

              {/* Physical Stock Qty Input */}
              <div>
                <label className="block text-xs font-mono uppercase text-[#e0e8e2]/70 mb-1.5 font-bold">
                  Verified Physical Stock Quantity (Units)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#2a3f3f]/60 border border-[#e0e8e2]/15 text-base font-black text-white focus:outline-none focus:border-[#89c07e]/60 font-mono"
                />
              </div>

              {/* Daily Consumption Rate Input */}
              <div>
                <label className="block text-xs font-mono uppercase text-[#e0e8e2]/70 mb-1.5 font-bold">
                  Average Daily Consumption Rate (Units / Day)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={dailyUse}
                  onChange={(e) => setDailyUse(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#2a3f3f]/60 border border-[#e0e8e2]/15 text-sm font-bold text-white focus:outline-none focus:border-[#89c07e]/60 font-mono"
                />
              </div>

              {/* LIVE REAL-TIME DAYS OF COVER & ALERT TRIGGER TELEMETRY */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isCriticalDeficit
                    ? 'bg-red-950/40 border-red-500/50 shadow-lg shadow-red-950/30'
                    : 'bg-[#467750]/20 border-[#89c07e]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#e0e8e2]/70">
                    Live Projected Days of Cover
                  </span>
                  <span
                    className={`text-lg font-black font-mono ${
                      isCriticalDeficit ? 'text-red-400' : 'text-[#89c07e]'
                    }`}
                  >
                    {liveDaysCover} Days
                  </span>
                </div>

                {isCriticalDeficit ? (
                  <div className="space-y-1.5 pt-1 border-t border-red-500/20 text-xs">
                    <div className="flex items-center space-x-1.5 text-red-300 font-bold">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-bounce" />
                      <span>CRITICAL SHORTAGE WARNING (&lt; 5 Days)</span>
                    </div>
                    <p className="text-[11px] text-[#e0e8e2]/80 leading-relaxed font-sans">
                      Submitting this count will <strong>automatically trigger dual Nodemailer email alerts</strong>:
                    </p>
                    <ul className="text-[10px] font-mono text-[#f0cd6e] list-disc list-inside space-y-0.5">
                      <li>Critical Shortage Alert to Central Manager (manager@pulsechain.com)</li>
                      <li>Urgent Emergency RFQ to Regional Suppliers (supplier@pulsechain.com)</li>
                    </ul>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5 text-xs text-[#89c07e] font-sans pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Inventory buffer is safe (above 5-day safety threshold).</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-slate-950 shadow-lg shadow-orange-500/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {submitting ? (
                  <span>Recording in SAP RFC & Sending Alerts...</span>
                ) : (
                  <>
                    <span>Submit Verified Count to SAP</span>
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
