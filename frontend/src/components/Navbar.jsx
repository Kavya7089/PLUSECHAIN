import React from 'react';
import {
  Activity,
  RefreshCw,
  Database,
  RotateCcw,
  History,
  ShieldCheck,
  Server,
  Zap,
} from 'lucide-react';

export default function Navbar({
  dataSource,
  loading,
  onRefresh,
  onReset,
  onOpenAudit,
  onOpenSapDetails,
  auditCount = 0,
}) {
  const isSapDirect = dataSource === 'SAP_RFC_SYSTEM';

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand & System Identity */}
        <div className="flex items-center space-x-4">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
            <Activity className="w-6 h-6 text-white" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-200 bg-clip-text text-transparent">
                PulseChain
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" /> Agentic ERP
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>Healthcare Supply Chain Resilience</span>
              <span className="inline-block w-1 h-1 rounded-full bg-slate-600"></span>
              <span className="text-slate-400">SAP NetWeaver RFC Connector</span>
            </p>
          </div>
        </div>

        {/* System Status & Actions */}
        <div className="flex items-center space-x-3">
          {/* SAP Connection Status Pill */}
          <button
            onClick={onOpenSapDetails}
            title="Click to view SAP NetWeaver RFC connection parameters"
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all duration-200 hover:scale-[1.02] bg-emerald-950/60 border-emerald-600/40 text-emerald-300 shadow-sm shadow-emerald-950"
          >
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">SAP S/4HANA (Connected)</span>
            <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-2">
              Z_PULSE_GET_STOCK
            </span>
          </button>

          {/* Audit History Log Button */}
          <button
            onClick={onOpenAudit}
            className="relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audit Trail</span>
            {auditCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500 text-slate-950 font-bold">
                {auditCount}
              </span>
            )}
          </button>

          {/* Baseline Reset Button */}
          <button
            onClick={onReset}
            disabled={loading}
            title="Reset inventory to original baseline records"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-amber-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset Baseline</span>
          </button>

          {/* Refresh SAP Data Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-600/20 transition-all duration-150 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Querying RFC...' : 'Sync SAP'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

