import React from 'react';
import { X, History, ArrowRight, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { MEDICINE_METADATA } from '../utils/inventoryHelper';

export default function AuditHistoryModal({ isOpen, onClose, auditLogs = [] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-abyss-card border border-sand-border shadow-2xl overflow-hidden my-8 text-abyss-text font-sans">
        <div className="p-6 border-b border-sand-border flex items-center justify-between bg-abyss-elevated">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-volt/15 border border-volt/30 text-volt">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-abyss-text tracking-tight">
                Supply Chain Reallocation Audit Trail
              </h3>
              <p className="text-xs text-abyss-muted font-mono">
                Immutable ledger of agentic stock balancing transfers
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

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {auditLogs.length === 0 ? (
            <div className="py-12 text-center text-abyss-muted font-mono">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50 text-volt" />
              <p className="text-sm">No reallocations dispatched yet in this session.</p>
              <p className="text-xs text-abyss-muted mt-1">
                Execute an autonomous reallocation from any critical shortage row to populate the audit log.
              </p>
            </div>
          ) : (
            auditLogs.map((log) => {
              const med = MEDICINE_METADATA[log.materialId] || { name: log.materialId };
              return (
                <div
                  key={log.id}
                  className="p-4 rounded-xl bg-abyss-elevated border border-sand-border hover:border-volt/50 transition-all font-mono"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-volt bg-abyss-card px-2 py-0.5 rounded border border-sand-border">
                        {log.id}
                      </span>
                      <span className="text-xs text-abyss-muted">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      {log.status || 'DISPATCHED'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-sm my-2">
                    <span className="font-bold text-abyss-text bg-abyss-card px-2.5 py-1 rounded border border-sand-border">
                      {log.donorHospital}
                    </span>
                    <div className="flex items-center space-x-1 text-volt font-bold text-xs">
                      <span>&minus;{log.quantity}</span>
                      <ArrowRight className="w-4 h-4" />
                      <span>+{log.quantity}</span>
                    </div>
                    <span className="font-bold text-abyss-text bg-abyss-card px-2.5 py-1 rounded border border-sand-border">
                      {log.targetHospital}
                    </span>
                  </div>

                  <div className="text-xs text-abyss-muted mt-2 flex items-center justify-between">
                    <span>
                      Material: <strong className="text-abyss-text">{log.materialId}</strong> ({med.name})
                    </span>
                    <span className="text-abyss-muted">
                      Target Buffer: {log.targetPrevStock} &rarr;{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400">{log.targetNewStock} units</strong> (
                      {log.targetNewDaysCover}d cover)
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-sand-border bg-abyss-elevated text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-volt text-volt-text font-bold hover:bg-volt-hover transition-colors"
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
}
