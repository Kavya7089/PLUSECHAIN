import React from 'react';
import { X, History, ArrowRight, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { MEDICINE_METADATA } from '../utils/inventoryHelper';

export default function AuditHistoryModal({ isOpen, onClose, auditLogs = [] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden my-8">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Supply Chain Reallocation Audit Trail
              </h3>
              <p className="text-xs text-slate-400">
                Immutable ledger of agentic stock balancing transfers
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

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {auditLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No reallocations dispatched yet in this session.</p>
              <p className="text-xs text-slate-500 mt-1">
                Execute an autonomous reallocation from any critical shortage row to populate the audit log.
              </p>
            </div>
          ) : (
            auditLogs.map((log) => {
              const med = MEDICINE_METADATA[log.materialId] || { name: log.materialId };
              return (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                        {log.id}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                      <CheckCircle2 className="w-3 h-3" />
                      {log.status || 'DISPATCHED'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-sm my-2">
                    <span className="font-mono font-bold text-white bg-slate-800 px-2.5 py-1 rounded">
                      {log.donorHospital}
                    </span>
                    <div className="flex items-center space-x-1 text-cyan-400 font-mono font-bold text-xs">
                      <span>&minus;{log.quantity}</span>
                      <ArrowRight className="w-4 h-4" />
                      <span>+{log.quantity}</span>
                    </div>
                    <span className="font-mono font-bold text-white bg-slate-800 px-2.5 py-1 rounded">
                      {log.targetHospital}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 mt-2 flex items-center justify-between">
                    <span>
                      Material: <strong className="text-white">{log.materialId}</strong> ({med.name})
                    </span>
                    <span className="text-slate-400">
                      Target Buffer: {log.targetPrevStock} &rarr;{' '}
                      <strong className="text-emerald-400">{log.targetNewStock} units</strong> (
                      {log.targetNewDaysCover}d cover)
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors"
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
}

