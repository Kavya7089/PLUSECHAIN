import React from 'react';
import CopyButton from '../common/CopyButton';
import {
  ArrowRight,
  CheckCircle2,
  FileCheck,
  MapPin,
  Route,
  ShieldCheck,
  ThermometerSnowflake,
  XCircle,
} from 'lucide-react';

export default function Screen4ComplianceCheck({
  selectedPlan,
  onProceedToApproval,
}) {
  const plan = selectedPlan || {
    id: 'OPTION_A',
    type: 'Internal Transfer',
    title: 'Option A: Internal Hub Reallocation',
    source: 'Hospital H005 (Central Surplus Hub)',
    fromHospital: 'H005',
    toHospital: 'H002',
    materialId: 'INS001',
    qty: 250,
    complianceFlag: 'Y',
    routeClear: true,
  };

  const isColdChainCompliant = plan.complianceFlag === 'Y';
  const isRouteClear = plan.routeClear !== false;
  const isGdpCertified = true;
  const isDonorSolvent = true;

  const allPassed = isColdChainCompliant && isRouteClear && isGdpCertified && isDonorSolvent;

  return (
    <div className="space-y-5 text-abyss-text font-sans">
      {/* Top Bento Header */}
      <div className="rounded-xl bg-abyss-card border border-sand-border p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-abyss-elevated text-volt text-xs font-mono font-bold border border-sand-border mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-volt" />
              <span>AI COMPLIANCE AGENT • REGULATORY GATE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-abyss-text tracking-tight">
              Screen 4: Compliance Check (Regulatory Verification)
            </h2>
            <p className="text-xs text-abyss-muted mt-1 max-w-2xl font-mono leading-relaxed">
              Autonomous multi-gate verification protocol ensuring strict healthcare cold-chain integrity,
              road transit clearance, and pharmaceutical GDP standards prior to ERP authorization.
            </p>
          </div>

          {allPassed && (
            <button
              type="button"
              onClick={onProceedToApproval}
              className="self-start md:self-center flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-volt text-volt-text hover:bg-volt-hover active:scale-95 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-[#FFD400]"
            >
              <span>Proceed to Human Approval (Screen 5)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Plan Under Audit Header Card */}
      <div className="p-4 rounded-xl bg-abyss-elevated border border-sand-border flex flex-wrap items-center justify-between gap-3 font-mono text-xs shadow-sm">
        <div>
          <span className="text-[11px] text-abyss-muted block">Scenario Under Regulatory Audit:</span>
          <div className="text-sm font-bold text-abyss-text flex items-center gap-2 mt-0.5">
            <span>{plan.title}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-abyss-card text-volt border border-sand-border">
              {plan.source} ➔ {plan.toHospital}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span>Volume: <strong className="text-volt">{plan.qty} Units</strong> ({plan.materialId})</span>
          <CopyButton text={plan.materialId} label="Material ID" />
        </div>
      </div>

      {/* 4 Verification Checklist Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CHECK 1: Cold-Chain Verification */}
        <div className={`p-5 rounded-xl border space-y-3 ${
          isColdChainCompliant ? 'bg-abyss-card border-sand-border' : 'bg-red-950/20 border-red-500/40'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-abyss-elevated border border-sand-border text-volt">
                <ThermometerSnowflake className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-abyss-muted block">
                  Check 1 • Thermal Stability
                </span>
                <h4 className="text-sm font-bold text-abyss-text">Cold-Chain Verification</h4>
              </div>
            </div>

            {isColdChainCompliant ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-volt text-volt-text flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> PASSED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-200 border border-red-500/40 flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-400" /> FAILED
              </span>
            )}
          </div>

          <div className="p-3 rounded-lg bg-abyss-elevated border border-sand-border font-mono text-xs flex justify-between">
            <span className="text-abyss-muted">SAP COMPLIANCE Flag:</span>
            <span className={`font-bold ${isColdChainCompliant ? 'text-volt' : 'text-red-400'}`}>
              COMPLIANCE === '{plan.complianceFlag}'
            </span>
          </div>

          <p className="text-xs text-abyss-muted leading-relaxed">
            {isColdChainCompliant
              ? 'Telemetry confirms active refrigerated transport between 2°C and 8°C. Zero excursions logged across transit corridor.'
              : 'CRITICAL FAILURE: Non-compliant vendor or broken cold chain telemetry detected.'}
          </p>
        </div>

        {/* CHECK 2: Route Clearance */}
        <div className={`p-5 rounded-xl border space-y-3 ${
          isRouteClear ? 'bg-abyss-card border-sand-border' : 'bg-red-950/20 border-red-500/40'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-abyss-elevated border border-sand-border text-volt">
                <Route className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-abyss-muted block">
                  Check 2 • Highway Viability
                </span>
                <h4 className="text-sm font-bold text-abyss-text">Freight Corridor Clearance</h4>
              </div>
            </div>

            {isRouteClear ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-volt text-volt-text flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> PASSED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-200 border border-red-500/40 flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-400" /> FAILED
              </span>
            )}
          </div>

          <div className="p-3 rounded-lg bg-abyss-elevated border border-sand-border font-mono text-xs flex justify-between">
            <span className="text-abyss-muted">OSRM Highway Status:</span>
            <span className="text-volt font-bold">Unobstructed Route</span>
          </div>

          <p className="text-xs text-abyss-muted leading-relaxed">
            OpenStreetMap road network verified clear of severe meteorological hazards or civil logistics blockades along the MP freight spine.
          </p>
        </div>

        {/* CHECK 3: GDP Certification */}
        <div className="p-5 rounded-xl bg-abyss-card border border-sand-border space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-abyss-elevated border border-sand-border text-volt">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-abyss-muted block">
                  Check 3 • Quality Standards
                </span>
                <h4 className="text-sm font-bold text-abyss-text">Pharma GDP Certification</h4>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-volt text-volt-text flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> PASSED
            </span>
          </div>

          <div className="p-3 rounded-lg bg-abyss-elevated border border-sand-border font-mono text-xs flex justify-between">
            <span className="text-abyss-muted">WHO GDP Audit Stamp:</span>
            <span className="text-abyss-text font-bold">ISO-9001 / CDSCO Verified</span>
          </div>

          <p className="text-xs text-abyss-muted leading-relaxed">
            Handling facilities maintain verified Good Distribution Practice accreditation with batch-level serial track and trace.
          </p>
        </div>

        {/* CHECK 4: Hospital Solvency / Quota */}
        <div className="p-5 rounded-xl bg-abyss-card border border-sand-border space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-abyss-elevated border border-sand-border text-volt">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-abyss-muted block">
                  Check 4 • Stock Allocation Safety
                </span>
                <h4 className="text-sm font-bold text-abyss-text">Donor Hub Buffer Retained</h4>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-volt text-volt-text flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> PASSED
            </span>
          </div>

          <div className="p-3 rounded-lg bg-abyss-elevated border border-sand-border font-mono text-xs flex justify-between">
            <span className="text-abyss-muted">Donor Remaining Cover:</span>
            <span className="text-volt font-bold">&gt; 18 Days Post-Transfer</span>
          </div>

          <p className="text-xs text-abyss-muted leading-relaxed">
            Source facility retains sufficient emergency buffer and will not enter deficit status after completing this transfer.
          </p>
        </div>
      </div>

      {/* Decision Summary Footer */}
      <div className="p-4 rounded-xl bg-abyss-card border border-sand-border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="font-mono text-xs">
          <span className="text-abyss-muted block text-[11px]">Audit Protocol Result:</span>
          <div className="text-sm font-bold text-abyss-text flex items-center gap-2 mt-0.5">
            <span className="text-volt">All 4 Compliance Gates Passed</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-abyss-elevated text-abyss-text border border-sand-border">
              Ready for SAP Execution
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onProceedToApproval}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-volt text-volt-text font-bold text-xs hover:bg-volt-hover active:scale-95 transition-all shadow-sm flex items-center justify-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-[#FFD400]"
        >
          <span>Authorize in Human Approval Gate (Screen 5)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
