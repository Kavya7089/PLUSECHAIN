import React from 'react';
import { X, Server, Database, Cpu } from 'lucide-react';

export default function SapDetailsModal({ isOpen, onClose, dataSource, sapInfo }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-abyss-card border border-sand-border shadow-2xl overflow-hidden my-8 text-abyss-text font-sans">
        <div className="p-6 border-b border-sand-border flex items-center justify-between bg-abyss-elevated">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-volt/15 border border-volt/30 text-volt">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-abyss-text tracking-tight">
                SAP NetWeaver RFC Architecture
              </h3>
              <p className="text-xs text-abyss-muted font-mono">
                Enterprise ERP Integration & Fallback Mode Specs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-abyss-muted hover:text-abyss-text hover:bg-abyss-card border border-sand-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-abyss-muted max-h-[70vh] overflow-y-auto">
          {/* Active Mode Banner */}
          <div className="p-4 rounded-xl bg-abyss-elevated border border-sand-border flex items-center justify-between">
            <div>
              <div className="font-semibold text-abyss-text">Current Runtime Mode:</div>
              <div className="text-abyss-muted mt-0.5">
                {dataSource === 'SAP_RFC_SYSTEM'
                  ? 'Connected directly to SAP S/4HANA via node-rfc C++ SDK'
                  : 'Operating in High-Resilience Fallback Mode (node-rfc handled gracefully)'}
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full font-mono text-xs font-bold uppercase border ${
                dataSource === 'SAP_RFC_SYSTEM'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-volt/15 text-volt border-volt/30'
              }`}
            >
              {dataSource || 'FALLBACK_MODE'}
            </span>
          </div>

          {/* RFC Parameters */}
          <div className="space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-abyss-text text-[11px] font-mono">
              Configured SAP RFC Credentials (.env)
            </h4>
            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="p-3 rounded-xl bg-abyss-elevated border border-sand-border">
                <span className="text-abyss-muted block text-[10px]">SAP_HOST</span>
                <span className="text-volt font-semibold">
                  {sapInfo?.sapConfig?.host || 'sap-ecc-prod.healthnet.corp'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-abyss-elevated border border-sand-border">
                <span className="text-abyss-muted block text-[10px]">SAP_SYSNR</span>
                <span className="text-abyss-text">{sapInfo?.sapConfig?.sysnr || '00'}</span>
              </div>
              <div className="p-3 rounded-xl bg-abyss-elevated border border-sand-border">
                <span className="text-abyss-muted block text-[10px]">SAP_CLIENT</span>
                <span className="text-abyss-text">{sapInfo?.sapConfig?.client || '100'}</span>
              </div>
              <div className="p-3 rounded-xl bg-abyss-elevated border border-sand-border">
                <span className="text-abyss-muted block text-[10px]">SAP_USER</span>
                <span className="text-abyss-text">{sapInfo?.sapConfig?.user || 'RFC_PULSECHAIN'}</span>
              </div>
            </div>
          </div>

          {/* Function Module Specs */}
          <div className="p-4 rounded-xl bg-abyss-elevated border border-sand-border space-y-2">
            <h4 className="font-bold text-abyss-text text-xs flex items-center gap-1.5 font-mono">
              <Database className="w-3.5 h-3.5 text-volt" />
              SAP Function Module: Z_PULSE_GET_STOCK
            </h4>
            <p className="text-abyss-muted leading-relaxed">
              In live SAP environments, the backend instantiates a <code className="text-volt font-mono font-bold">noderfc.Client</code>,
              opens the RFC connection, invokes <code className="text-volt font-mono font-bold">client.call('Z_PULSE_GET_STOCK', {})</code>,
              and unpacks output table <code className="text-volt font-mono font-bold">result.ET_STOCK</code>. The connection is safely
              released in the <code className="text-volt font-mono font-bold">finally</code> block.
            </p>
          </div>

          {/* Fallback Guarantee */}
          <div className="p-4 rounded-xl bg-abyss-elevated border border-sand-border space-y-2">
            <h4 className="font-bold text-abyss-text text-xs flex items-center gap-1.5 font-mono">
              <Cpu className="w-3.5 h-3.5 text-volt" />
              Dual-Engine Fallback Guarantee
            </h4>
            <p className="text-abyss-muted leading-relaxed">
              If node-rfc binaries are absent (common in containerized/developer workstations lacking SAP NW RFC C++ SDK),
              the backend intercepts the module load exception and serves a structured sample dataset matching the schema:
            </p>
            <pre className="p-3 rounded-xl bg-abyss-card border border-sand-border font-mono text-[11px] text-volt overflow-x-auto">
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

        <div className="p-4 border-t border-sand-border bg-abyss-elevated text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-volt text-volt-text font-bold hover:bg-volt-hover transition-colors"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
}
