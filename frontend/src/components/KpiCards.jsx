import React from 'react';
import {
  Building2,
  Package,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Cpu,
} from 'lucide-react';

export default function KpiCards({
  totalHospitals,
  totalInventoryVolume,
  criticalShortagesCount,
  surplusCount,
  reallocationsCount,
  onFilterCritical,
  activeFilter,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Total Hospitals Monitored */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700 transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Hospitals Monitored
          </span>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {totalHospitals}
          </div>
          <span className="text-xs font-medium text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-800/40">
            Regional Network
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
          <span>Connected via SAP ERP</span>
          <span className="text-emerald-400 font-mono">100% Online</span>
        </div>
      </div>

      {/* 2. Total Inventory Volume */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700 transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Inventory Volume
          </span>
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Package className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
            {totalInventoryVolume.toLocaleString()}
          </div>
          <span className="text-xs font-medium text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-800/40">
            Total Units
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
          <span>Aggregated from ET_STOCK</span>
          <span className="text-cyan-400 font-mono">5 Material Classes</span>
        </div>
      </div>

      {/* 3. Critical Shortages (Count where daysCover < 5) */}
      <div
        onClick={onFilterCritical}
        className={`glass-card rounded-2xl p-5 border cursor-pointer transition-all duration-300 relative overflow-hidden ${
          criticalShortagesCount > 0
            ? 'border-red-500/60 bg-gradient-to-br from-red-950/40 via-slate-900/60 to-slate-900/90 glow-red'
            : 'border-slate-800/80 hover:border-slate-700'
        }`}
      >
        {criticalShortagesCount > 0 && (
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl pointer-events-none"></div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-red-300 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Critical Shortages
          </span>
          <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <div className="text-3xl font-extrabold text-red-100 tracking-tight flex items-baseline gap-2">
            <span>{criticalShortagesCount}</span>
            <span className="text-xs font-normal text-red-400">
              {criticalShortagesCount === 1 ? 'line item' : 'line items'}
            </span>
          </div>
          <span className="text-[11px] font-bold text-red-200 bg-red-900/80 px-2.5 py-0.5 rounded-md border border-red-500/50 uppercase tracking-wider">
            &lt; 5 Days Cover
          </span>
        </div>
        <div className="mt-2 text-xs text-red-300/80 flex items-center justify-between">
          <span>Structural Disruption Risk</span>
          <span className="underline hover:text-white font-medium">
            {activeFilter === 'critical' ? 'Showing Filtered' : 'Click to Filter'}
          </span>
        </div>
      </div>

      {/* 4. Resilience & Agentic Reallocation Metrics */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700 transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Autonomous Balancer
          </span>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Cpu className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {surplusCount}
            <span className="text-sm font-normal text-emerald-400 ml-1.5 font-sans">
              Donors
            </span>
          </div>
          <span className="text-xs font-medium text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/40">
            &gt; 10d Surplus
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
          <span>Reallocations Dispatched</span>
          <span className="text-emerald-400 font-bold font-mono">
            {reallocationsCount} Executed
          </span>
        </div>
      </div>
    </div>
  );
}

