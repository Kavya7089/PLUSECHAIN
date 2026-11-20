import React from 'react';
import { X, Server, Database, Key, CheckCircle, ShieldAlert, Cpu } from 'lucide-react';

export default function SapDetailsModal({ isOpen, onClose, dataSource, sapInfo }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden my-8">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                SAP NetWeaver RFC Architecture
              </h3>
              <p className="text-xs text-slate-400">
                Enterprise ERP Integration & Fallback Mode Specs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-slate-300 max-h-[70vh] overflow-y-auto">
          {/* Active Mode Banner */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-semibold text-white">Current Runtime Mode:</div>
              <div className="text-slate-400 mt-0.5">
                {dataSource === 'SAP_RFC_SYSTEM'
                  ? 'Connected directly to SAP S/4HANA via node-rfc C++ SDK'
                  : 'Operating in High-Resilience Fallback Mode (node-rfc handled gracefully)'}
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full font-mono text-xs font-bold uppercase border ${
                dataSource === 'SAP_RFC_SYSTEM'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : 'bg-amber-950 text-amber-300 border-amber-700'
              }`}
            >
              {dataSource || 'FALLBACK_MODE'}
            </span>
          </div>

          {/* RFC Parameters */}
          <div className="space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
              Configured SAP RFC Credentials (.env)
            </h4>
            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">SAP_HOST</span>
                <span className="text-cyan-300 font-semibold">
                  {sapInfo?.sapConfig?.host || 'sap-ecc-prod.healthnet.corp'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">SAP_SYSNR</span>
                <span className="text-slate-200">{sapInfo?.sapConfig?.sysnr || '00'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">SAP_CLIENT</span>
                <span className="text-slate-200">{sapInfo?.sapConfig?.client || '100'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">SAP_USER</span>
                <span className="text-slate-200">{sapInfo?.sapConfig?.user || 'RFC_PULSECHAIN'}</span>
              </div>
            </div>
          </div>

          {/* Function Module Specs */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              SAP Function Module: Z_PULSE_GET_STOCK
            </h4>
            <p className="text-slate-400 leading-relaxed">
              In live SAP environments, the backend instantiates a <code className="text-cyan-300">noderfc.Client</code>,
              opens the RFC connection, invokes <code className="text-cyan-300">client.call('Z_PULSE_GET_STOCK', {})</code>,
              and unpacks output table <code className="text-cyan-300">result.ET_STOCK</code>. The connection is safely
              released in the <code className="text-cyan-300">finally</code> block.
            </p>
          </div>

          {/* Fallback Guarantee */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              Dual-Engine Fallback Guarantee
            </h4>
            <p className="text-slate-400 leading-relaxed">
              If node-rfc binaries are absent (common in containerized/developer workstations lacking SAP NW RFC C++ SDK),
              the backend intercepts the module load exception and serves a structured sample dataset matching the schema:
            </p>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-cyan-300 overflow-x-auto">
{`{
  HOSPITAL_ID: 'H001',
  MATERIAL_ID: 'INS001',
  STOCK_QTY: 600,
  DAILY_USE: 100,
  UNIT: 'EA'
}`}
            </pre>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
}

