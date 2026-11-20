import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CheckCircle,
  Building2,
  Package,
  TrendingUp,
  Cpu,
  Layers,
  Clock,
  Send,
  AlertTriangle,
} from 'lucide-react';
import {
  MEDICINE_METADATA,
  HOSPITAL_METADATA,
  calculateDaysCover,
  findSurplusDonors,
  suggestAutonomousReallocation,
} from '../utils/inventoryHelper';

export default function ReallocationModal({
  isOpen,
  onClose,
  targetItem,
  allInventory = [],
  onConfirmReallocation,
  isExecuting = false,
}) {
  if (!isOpen || !targetItem) return null;

  const targetHospitalInfo = HOSPITAL_METADATA[targetItem.HOSPITAL_ID] || {
    name: targetItem.HOSPITAL_ID,
    region: 'Network District',
  };
  const medicineInfo = MEDICINE_METADATA[targetItem.MATERIAL_ID] || {
    name: targetItem.MATERIAL_ID,
    category: 'Essential Therapeutic',
    dosage: targetItem.UNIT,
  };

  const targetCurrentDays = calculateDaysCover(targetItem.STOCK_QTY, targetItem.DAILY_USE);

  // Autonomous Recommendation calculation
  const recommendation = suggestAutonomousReallocation(allInventory, targetItem);
  const surplusDonors = findSurplusDonors(
    allInventory,
    targetItem.HOSPITAL_ID,
    targetItem.MATERIAL_ID
  );

  // State for chosen donor and quantity
  const [selectedDonorId, setSelectedDonorId] = useState('');
  const [transferQty, setTransferQty] = useState(0);

  useEffect(() => {
    if (surplusDonors.length > 0) {
      const defaultDonor = surplusDonors[0];
      setSelectedDonorId(defaultDonor.HOSPITAL_ID);
      setTransferQty(recommendation.recommendedTransfer || defaultDonor.safeSurplusUnits);
    } else {
      setSelectedDonorId('');
      setTransferQty(0);
    }
  }, [targetItem, allInventory]);

  const activeDonor = surplusDonors.find((d) => d.HOSPITAL_ID === selectedDonorId);
  const donorHospitalInfo = activeDonor
    ? HOSPITAL_METADATA[activeDonor.HOSPITAL_ID] || { name: activeDonor.HOSPITAL_ID }
    : null;

  // Real-time projections based on slider / input
  const targetProjectedStock = targetItem.STOCK_QTY + Number(transferQty || 0);
  const targetProjectedDays = calculateDaysCover(targetProjectedStock, targetItem.DAILY_USE);

  const donorCurrentDays = activeDonor
    ? calculateDaysCover(activeDonor.STOCK_QTY, activeDonor.DAILY_USE)
    : 0;
  const donorProjectedStock = activeDonor
    ? activeDonor.STOCK_QTY - Number(transferQty || 0)
    : 0;
  const donorProjectedDays = activeDonor
    ? calculateDaysCover(donorProjectedStock, activeDonor.DAILY_USE)
    : 0;

  const maxAllowedTransfer = activeDonor ? activeDonor.STOCK_QTY - activeDonor.DAILY_USE * 5 : 0;

  const handleExecute = () => {
    if (!activeDonor || transferQty <= 0) return;
    onConfirmReallocation({
      donorHospital: activeDonor.HOSPITAL_ID,
      targetHospital: targetItem.HOSPITAL_ID,
      materialId: targetItem.MATERIAL_ID,
      quantity: Number(transferQty),
      reason: `Agentic autonomous replenishment: +${targetProjectedDays - targetCurrentDays} days cover achieved.`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden my-8">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-400"></div>

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/40">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Agentic Supply Chain Reallocation
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700 uppercase tracking-wider">
                  Autonomous Plan
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic stock balancing algorithm sensing structural disruption in real-time
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isExecuting}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Target in Distress Overview */}
          <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/40 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold font-mono text-red-200 bg-red-900/60 px-2 py-0.5 rounded">
                      {targetItem.HOSPITAL_ID}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {targetHospitalInfo.name}
                    </span>
                  </div>
                  <div className="text-xs text-red-300/80 mt-0.5">
                    Deficit Alert: Structural supply shock detected
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-red-500/30">
                <div>
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">
                    Current Stock
                  </div>
                  <div className="text-sm font-bold font-mono text-white">
                    {targetItem.STOCK_QTY} {targetItem.UNIT}
                  </div>
                </div>
                <div className="h-6 w-px bg-slate-700"></div>
                <div>
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">
                    Daily Burn
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-300">
                    {targetItem.DAILY_USE} {targetItem.UNIT}/d
                  </div>
                </div>
                <div className="h-6 w-px bg-slate-700"></div>
                <div>
                  <div className="text-[10px] uppercase text-red-400 font-bold">Days Cover</div>
                  <div className="text-base font-extrabold font-mono text-red-400">
                    {targetCurrentDays} Days
                  </div>
                </div>
              </div>
            </div>

            {/* Medicine details badge */}
            <div className="mt-3 pt-3 border-t border-red-500/20 flex items-center justify-between text-xs">
              <span className="text-slate-300">
                Target Medicine:{' '}
                <strong className="text-white font-mono">{targetItem.MATERIAL_ID}</strong> (
                {medicineInfo.name} - {medicineInfo.category})
              </span>
              <span className="text-red-400 font-medium">Critical Threshold: &lt; 5 Days</span>
            </div>
          </div>

          {/* AI Recommendation Engine Analysis */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/30 via-slate-900 to-slate-900 border border-cyan-800/40">
            <div className="flex items-center space-x-2 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>AI Agent Reallocation Strategy</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The agent analyzed all network hospitals storing{' '}
              <code className="text-cyan-400 font-mono">{targetItem.MATERIAL_ID}</code>. Identified{' '}
              <strong className="text-emerald-400 font-mono">{surplusDonors.length}</strong> hospital(s)
              maintaining surplus inventory (&gt; 10 days cover).
            </p>
          </div>

          {/* Donor Hospital Selection */}
          {surplusDonors.length === 0 ? (
            <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-600/40 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-amber-200">
                No Surplus Donor Found in Network
              </h4>
              <p className="text-xs text-amber-300/80 mt-1">
                No facility currently holds surplus inventory (&gt; 10 days of cover) for material{' '}
                {targetItem.MATERIAL_ID}. Recommend triggering an external SAP Purchase Order (BAPI_PO_CREATE).
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Select Surplus Donor Hospital (&gt;10 Days Cover)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {surplusDonors.map((donor) => {
                    const isSelected = donor.HOSPITAL_ID === selectedDonorId;
                    const hInfo = HOSPITAL_METADATA[donor.HOSPITAL_ID] || {
                      name: donor.HOSPITAL_ID,
                    };
                    return (
                      <div
                        key={donor.HOSPITAL_ID}
                        onClick={() => setSelectedDonorId(donor.HOSPITAL_ID)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                              {donor.HOSPITAL_ID}
                            </span>
                            <span className="text-xs font-bold text-white">{hInfo.name}</span>
                          </div>
                          {isSelected && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                        </div>

                        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 font-mono">
                          <span>Stock: {donor.STOCK_QTY} {donor.UNIT}</span>
                          <span className="text-emerald-400 font-bold">
                            {donor.daysCover} Days Cover
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Safe Transfer Capacity: ~{donor.safeSurplusUnits} {donor.UNIT}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Transfer Quantity Slider & Controls */}
              {activeDonor && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Reallocation Volume ({targetItem.UNIT})
                      </label>
                      <p className="text-[11px] text-slate-400">
                        Adjust units to transfer from {activeDonor.HOSPITAL_ID} to{' '}
                        {targetItem.HOSPITAL_ID}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="10"
                        max={maxAllowedTransfer}
                        step="10"
                        value={transferQty}
                        onChange={(e) => setTransferQty(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-24 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-right font-mono font-bold text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                      <span className="text-xs font-mono text-slate-400">{targetItem.UNIT}</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="10"
                    max={maxAllowedTransfer}
                    step="10"
                    value={transferQty}
                    onChange={(e) => setTransferQty(parseInt(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-400">AI Presets:</span>
                    <button
                      type="button"
                      onClick={() => setTransferQty(targetItem.DAILY_USE * 4)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                    >
                      +4 Days Buffer
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransferQty(targetItem.DAILY_USE * 7)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                    >
                      +7 Days Buffer (Safe)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransferQty(activeDonor.safeSurplusUnits)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                    >
                      Max Safe Surplus ({activeDonor.safeSurplusUnits} {targetItem.UNIT})
                    </button>
                  </div>
                </div>
              )}

              {/* Dynamic Before & After Impact Matrix */}
              {activeDonor && (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                    Projected Network Impact Matrix
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Donor Impact */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Donor Facility:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {activeDonor.HOSPITAL_ID}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Stock Units:</span>
                        <span className="font-mono text-slate-200">
                          {activeDonor.STOCK_QTY} &rarr;{' '}
                          <strong className="text-white">{donorProjectedStock}</strong> {targetItem.UNIT}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Days of Cover:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {donorCurrentDays}d &rarr; {donorProjectedDays}d (Healthy Surplus)
                        </span>
                      </div>
                    </div>

                    {/* Target Impact */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-emerald-900/50 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Target Facility:</span>
                        <span className="font-mono font-bold text-cyan-400">
                          {targetItem.HOSPITAL_ID}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Stock Units:</span>
                        <span className="font-mono text-slate-200">
                          {targetItem.STOCK_QTY} &rarr;{' '}
                          <strong className="text-emerald-400">{targetProjectedStock}</strong>{' '}
                          {targetItem.UNIT}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Days of Cover:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          <span className="text-red-400 line-through mr-1">
                            {targetCurrentDays}d
                          </span>
                          &rarr; {targetProjectedDays}d (Disruption Cleared)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleExecute}
            disabled={isExecuting || surplusDonors.length === 0 || transferQty <= 0}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-xl shadow-cyan-500/20 ring-1 ring-cyan-400/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            <Send className={`w-4 h-4 ${isExecuting ? 'animate-bounce' : ''}`} />
            <span>
              {isExecuting
                ? 'Dispatching RFC Stock Transfer...'
                : `Confirm Reallocation (${transferQty} ${targetItem.UNIT})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

