import React, { useState } from 'react';
import CopyButton from '../common/CopyButton';
import ConfirmModal from '../common/ConfirmModal';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CheckSquare,
  Clock,
  Database,
  DollarSign,
  FileText,
  Lock,
  Package,
  RotateCcw,
  ShieldCheck,
  Truck,
} from 'lucide-react';

export default function Screen5HumanApproval({
  selectedPlan,
  onExecuteSapTransfer,
  isExecuting = false,
  onResetBaseline,
  onNavigateToScreen,
}) {
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [confirmExecuteOpen, setConfirmExecuteOpen] = useState(false);
  const [executedDocId, setExecutedDocId] = useState(null);

  const plan = selectedPlan || {
    id: 'OPTION_A',
    type: 'Internal Transfer',
    title: 'Option A: Internal Hub Reallocation',
    source: 'Hospital H005 (Central Surplus Hub)',
    fromHospital: 'H005',
    toHospital: 'H002',
    materialId: 'INS001',
    qty: 250,
    leadTimeDays: 0,
    costFormatted: '₹250 Total',
  };

  const handleAuthorizeConfirmed = async () => {
    setConfirmExecuteOpen(false);
    const success = await onExecuteSapTransfer(plan);
    if (success) {
      setExecutedDocId(`MATDOC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`);
      setSuccessModalOpen(true);
    }
  };

  return (
    <div className="space-y-5 text-abyss-text font-sans">
      {/* Top Bento Header */}
      <div className="rounded-xl bg-abyss-card border border-sand-border p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-abyss-elevated text-volt text-xs font-mono font-bold border border-sand-border mb-2">
              <Lock className="w-3.5 h-3.5 text-volt" />
              <span>FINAL HUMAN AUTHORIZATION GATE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-abyss-text tracking-tight">
              Screen 5: Human Approval (ERP Transfer Execution)
            </h2>
            <p className="text-xs text-abyss-muted mt-1 max-w-2xl font-mono leading-relaxed">
              Review and authorize the validated allocation scenario. Authorizing initiates the 2-step
              custody chain and records the material movement in SAP Gateway OData v2 (ZPLUSE_SRV).
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-volt px-3 py-1.5 rounded-lg bg-abyss-elevated border border-sand-border flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-volt" />
              <span>Compliance Verified</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3-Step Custody Lifecycle Bento Card */}
      <div className="rounded-xl bg-abyss-card border border-sand-border p-5 space-y-4 shadow-sm font-mono text-xs">
        <div className="flex items-center justify-between border-b border-sand-border pb-3">
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4 text-volt" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-abyss-text">
              2-Step Goods Approval & Verification Lifecycle (SAP S/4HANA System of Record)
            </h4>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-abyss-elevated text-volt border border-sand-border font-bold">
            SAP ZPULSE_INV PROTOCOL
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Step 1: Requested */}
          <div className="p-4 rounded-lg bg-abyss-elevated border border-sand-border space-y-1.5">
            <div className="flex items-center justify-between text-volt">
              <span className="text-[10px] font-bold uppercase">Step 1: Authorization Gate</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-abyss-text font-bold text-xs">Manager Sign-Off</div>
            <p className="text-[11px] text-abyss-muted font-sans leading-tight">
              Reallocation order initiated in SAP gateway with cryptographic audit trail.
            </p>
          </div>

          {/* Step 2: Source Dispatch */}
          <div className="p-4 rounded-lg bg-abyss-elevated border border-sand-border space-y-1.5">
            <div className="flex items-center justify-between text-volt">
              <span className="text-[10px] font-bold uppercase">Step 2: Source Dispatch</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
            <div className="text-abyss-text font-bold text-xs">-SAP ZPULSE_INV Deduction</div>
            <p className="text-[11px] text-abyss-muted font-sans leading-tight">
              Origin Shopkeeper verifies physical stock count before recording outward dispatch.
            </p>
          </div>

          {/* Step 3: Dest Receipt */}
          <div className="p-4 rounded-lg bg-abyss-elevated border border-sand-border space-y-1.5">
            <div className="flex items-center justify-between text-volt">
              <span className="text-[10px] font-bold uppercase">Step 3: Dest Goods Receipt</span>
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
            <div className="text-abyss-text font-bold text-xs">+SAP ZPULSE_INV Addition</div>
            <p className="text-[11px] text-abyss-muted font-sans leading-tight">
              Destination Shopkeeper inspects tamper seal & commits stock into receiving hospital.
            </p>
          </div>
        </div>
      </div>

      {/* Plan Summary Bento Card */}
      <div className="rounded-xl bg-abyss-card border border-sand-border p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sand-border">
          <div>
            <span className="text-xs uppercase font-mono font-bold text-volt tracking-wider block">
              Authorized Scenario Configuration
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-abyss-text tracking-tight mt-1">{plan.title}</h3>
          </div>
          <span className="px-3 py-1 rounded text-xs font-mono font-bold bg-volt text-volt-text self-start sm:self-center">
            PASSED SCREEN 4 COMPLIANCE
          </span>
        </div>

        {/* 4 Execution Metric Bento Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-lg bg-abyss-elevated border border-sand-border space-y-1">
            <span className="text-[10px] text-abyss-muted uppercase flex items-center gap-1">
              <Package className="w-3 h-3 text-volt" /> Transfer Quantity
            </span>
            <span className="text-lg font-black text-abyss-text block">{plan.qty} Units</span>
            <span className="text-[10px] text-abyss-muted block">{plan.materialId}</span>
          </div>

          <div className="p-3.5 rounded-lg bg-abyss-elevated border border-sand-border space-y-1">
            <span className="text-[10px] text-abyss-muted uppercase flex items-center gap-1">
              <Clock className="w-3 h-3 text-volt" /> Transit Duration
            </span>
            <span className="text-lg font-black text-volt block">{plan.leadTimeDays} Days</span>
            <span className="text-[10px] text-abyss-muted block">Direct Road Courier</span>
          </div>

          <div className="p-3.5 rounded-lg bg-abyss-elevated border border-sand-border space-y-1">
            <span className="text-[10px] text-abyss-muted uppercase flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-volt" /> Net Cost Impact
            </span>
            <span className="text-lg font-black text-abyss-text block">{plan.costFormatted}</span>
            <span className="text-[10px] text-volt block">Pre-Approved Budget</span>
          </div>

          <div className="p-3.5 rounded-lg bg-abyss-elevated border border-sand-border space-y-1">
            <span className="text-[10px] text-abyss-muted uppercase flex items-center gap-1">
              <Database className="w-3 h-3 text-volt" /> ERP Commitment
            </span>
            <span className="text-sm font-bold text-volt block mt-1">SAP RFC Active</span>
            <span className="text-[10px] text-abyss-muted block">ZPULSE_INV Update</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-sand-border">
          <button
            type="button"
            onClick={onResetBaseline}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-abyss-elevated hover:bg-sand-border/30 text-abyss-muted hover:text-abyss-text text-xs font-mono font-bold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Baseline</span>
          </button>

          <button
            type="button"
            disabled={isExecuting}
            onClick={() => setConfirmExecuteOpen(true)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-volt text-volt-text font-bold text-xs uppercase tracking-wider hover:bg-volt-hover active:scale-95 transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#FFD400]"
          >
            <CheckSquare className="w-4 h-4" />
            <span>{isExecuting ? 'Committing to SAP S/4HANA...' : 'Authorize & Execute in SAP ERP'}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal before Executing Live Transfer */}
      <ConfirmModal
        isOpen={confirmExecuteOpen}
        title="Confirm SAP S/4HANA Transfer"
        message={`Authorize immediate allocation transfer of ${plan.qty} units of ${plan.materialId} to destination hospital ${plan.toHospital}? This action will record live dispatch records in SAP ERP and alert warehouse custody staff.`}
        confirmLabel="Confirm & Commit"
        cancelLabel="Review Again"
        onConfirm={handleAuthorizeConfirmed}
        onClose={() => setConfirmExecuteOpen(false)}
      />

      {/* Success Modal */}
      {successModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="w-full max-w-md rounded-xl bg-abyss-card border border-sand-border p-6 space-y-4 shadow-xl text-abyss-text font-mono">
            <div className="w-12 h-12 rounded-xl bg-abyss-elevated border border-sand-border text-volt flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-abyss-text font-sans">SAP Transaction Committed</h3>
              <p className="text-xs text-abyss-muted">
                Material movement successfully posted to SAP S/4HANA Gateway OData v2.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-abyss-elevated border border-sand-border text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-abyss-muted">Material Document:</span>
                <div className="flex items-center space-x-1">
                  <span className="text-volt font-bold">{executedDocId}</span>
                  <CopyButton text={executedDocId} label="Doc ID" />
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-abyss-muted">Movement Type:</span>
                <span className="text-abyss-text">301 (Plant to Plant Transfer)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-abyss-muted">Status:</span>
                <span className="text-volt font-bold">DISPATCH_PENDING_APPROVAL</span>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSuccessModalOpen(false);
                  onNavigateToScreen(1);
                }}
                className="w-full py-2.5 rounded-lg bg-volt text-volt-text font-bold text-xs uppercase hover:bg-volt-hover transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
