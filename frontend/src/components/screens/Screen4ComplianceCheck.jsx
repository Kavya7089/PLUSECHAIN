import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  FileCheck,
  MapPin,
  Route,
  ShieldCheck,
  Snowflake,
  ThermometerSnowflake,
  XCircle,
  Zap,
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

  // Evaluate Check 1: COMPLIANCE === 'Y' (Cold-Chain Verified)
  const isColdChainCompliant = plan.complianceFlag === 'Y';

  // Evaluate Check 2: Route Clear of Disruptions
  const isRouteClear = plan.routeClear !== false;

  // Additional regulatory validations
  const isGdpCertified = true;
  const isDonorSolvent = true;

  const allPassed = isColdChainCompliant && isRouteClear && isGdpCertified && isDonorSolvent;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl glass-panel border border-[#e0e8e2]/15 bg-[#2c2e35]/60">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#2a3f3f] text-[#89c07e] text-xs font-mono font-semibold mb-2 border border-[#89c07e]/30">
            <ShieldCheck className="w-3.5 h-3.5 text-[#89c07e]" />
            <span>AI COMPLIANCE AGENT • REGULATORY GATE</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#e0e8e2] tracking-tight">
            Screen 4: Compliance Check (Compliance Agent)
          </h2>
          <p className="text-xs text-[#e0e8e2]/70 mt-1 max-w-2xl leading-relaxed">
            Autonomous multi-gate verification protocol ensuring strict healthcare cold-chain integrity,
            route viability, and pharmaceutical GDP standards before authorization.
          </p>
        </div>

        {allPassed && (
          <button
            onClick={onProceedToApproval}
            className="self-start md:self-center flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-xs bg-gradient-to-r from-[#467750] via-[#89c07e] to-[#f0cd6e] text-[#2c2e35] shadow-xl shadow-[#467750]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span>Proceed to Human Approval (Screen 5)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Plan Under Audit Header */}
      <div className="p-4 rounded-2xl bg-[#2a3f3f]/60 border border-[#e0e8e2]/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs text-[#e0e8e2]/60">Action Under Regulatory Audit:</div>
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <span>{plan.title}</span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#2c2e35] text-[#89c07e] border border-[#89c07e]/30">
              Source: {plan.source} &rarr; Target: {plan.toHospital}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-[#e0e8e2]/80">Volume:</span>
          <span className="text-sm font-mono font-bold text-[#f0cd6e]">
            {plan.qty} Units ({plan.materialId})
          </span>
        </div>
      </div>

      {/* 4 Verification Checklist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* CHECK 1: Cold-Chain Verification (COMPLIANCE === 'Y') */}
        <div
          className={`p-6 rounded-3xl glass-panel border transition-all ${
            isColdChainCompliant
              ? 'border-[#89c07e]/60 bg-[#467750]/15 glow-mint'
              : 'border-red-500/60 bg-red-950/30'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2.5 rounded-2xl ${
                  isColdChainCompliant ? 'bg-[#89c07e]/20 text-[#89c07e]' : 'bg-red-500/20 text-red-400'
                }`}
              >
                <ThermometerSnowflake className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#e0e8e2]/60 block">
                  Check 1 • Temperature Assurance
                </span>
                <h4 className="text-base font-bold text-white">Cold-Chain Verification</h4>
              </div>
            </div>

            {/* Green Checkmark or Red X */}
            {isColdChainCompliant ? (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#89c07e]/20 text-[#89c07e] border border-[#89c07e]/50 text-xs font-bold font-mono">
                <CheckCircle2 className="w-4 h-4 text-[#89c07e]" />
                <span>PASSED</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-900/60 text-red-300 border border-red-500 text-xs font-bold font-mono">
                <XCircle className="w-4 h-4 text-red-400" />
                <span>FAILED</span>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#2a3f3f]/60 font-mono">
              <span className="text-[#e0e8e2]/70">SAP COMPLIANCE Flag:</span>
              <span
                className={`font-bold ${
                  isColdChainCompliant ? 'text-[#89c07e]' : 'text-red-400'
                }`}
              >
                COMPLIANCE === '{plan.complianceFlag}'
              </span>
            </div>
            <p className="text-xs text-[#e0e8e2]/80 leading-relaxed">
              {isColdChainCompliant
                ? 'Source is certified with real-time temperature telemetry (maintaining 2°C to 8°C). Zero cold-chain excursions logged in last 180 days.'
                : 'CRITICAL FAILURE: Supplier has COMPLIANCE !== "Y". Excursion risk detected.'}
            </p>
          </div>
        </div>

        {/* CHECK 2: Internal Transfer Route Clear of Disruptions */}
        <div
          className={`p-6 rounded-3xl glass-panel border transition-all ${
            isRouteClear
              ? 'border-[#89c07e]/60 bg-[#467750]/15 glow-mint'
              : 'border-red-500/60 bg-red-950/30'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2.5 rounded-2xl ${
                  isRouteClear ? 'bg-[#89c07e]/20 text-[#89c07e]' : 'bg-red-500/20 text-red-400'
                }`}
              >
                <Route className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#e0e8e2]/60 block">
                  Check 2 • Route Assessment
                </span>
                <h4 className="text-base font-bold text-white">Disruption-Free Corridor</h4>
              </div>
            </div>

            {/* Green Checkmark or Red X */}
            {isRouteClear ? (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#89c07e]/20 text-[#89c07e] border border-[#89c07e]/50 text-xs font-bold font-mono">
                <CheckCircle2 className="w-4 h-4 text-[#89c07e]" />
                <span>PASSED</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-900/60 text-red-300 border border-red-500 text-xs font-bold font-mono">
                <XCircle className="w-4 h-4 text-red-400" />
                <span>FAILED</span>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#2a3f3f]/60 font-mono">
              <span className="text-[#e0e8e2]/70">Corridor Clearance:</span>
              <span className={`font-bold ${isRouteClear ? 'text-[#89c07e]' : 'text-red-400'}`}>
                {isRouteClear ? '100% CLEAR OF DISRUPTIONS' : 'INTERSECTS FLOOD/STRIKE ZONE'}
              </span>
            </div>
            <p className="text-xs text-[#e0e8e2]/80 leading-relaxed">
              {isRouteClear
                ? 'Inland logistics corridor bypasses Port of Rotterdam strike zone and East District severe weather hazards. Zero ground delays anticipated.'
                : 'Transit route intersects maritime port closure corridor. Cannot authorize.'}
            </p>
          </div>
        </div>

        {/* CHECK 3: GDP Quality Certification */}
        <div className="p-6 rounded-3xl glass-panel border border-[#89c07e]/50 bg-[#467750]/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-[#89c07e]/20 text-[#89c07e]">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#e0e8e2]/60 block">
                  Check 3 • Regulatory Good Distribution
                </span>
                <h4 className="text-base font-bold text-white">GDP Section 8 Protocol</h4>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#89c07e]/20 text-[#89c07e] border border-[#89c07e]/50 text-xs font-bold font-mono">
              <CheckCircle2 className="w-4 h-4 text-[#89c07e]" />
              <span>PASSED</span>
            </div>
          </div>
          <p className="text-xs text-[#e0e8e2]/80 mt-4 leading-relaxed">
            EU & US FDA Good Distribution Practice (GDP) standards certified. Chain of custody digital
            manifest generated for SAP RFC execution.
          </p>
        </div>

        {/* CHECK 4: Donor Solvency & Safe Buffer Margin */}
        <div className="p-6 rounded-3xl glass-panel border border-[#89c07e]/50 bg-[#467750]/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-[#89c07e]/20 text-[#89c07e]">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#e0e8e2]/60 block">
                  Check 4 • Donor Solvency Guard
                </span>
                <h4 className="text-base font-bold text-white">Reserve Quota Protection</h4>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#89c07e]/20 text-[#89c07e] border border-[#89c07e]/50 text-xs font-bold font-mono">
              <CheckCircle2 className="w-4 h-4 text-[#89c07e]" />
              <span>PASSED</span>
            </div>
          </div>
          <p className="text-xs text-[#e0e8e2]/80 mt-4 leading-relaxed">
            Transferring 250 units leaves source node with 4,750+ units (95 days cover), vastly exceeding
            the minimum mandatory 15-day reserve threshold.
          </p>
        </div>
      </div>

      {/* Compliance Approval Banner */}
      <div className="p-6 rounded-3xl glass-panel border border-[#89c07e]/50 bg-gradient-to-r from-[#2c2e35] via-[#467750]/30 to-[#2c2e35] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#89c07e] text-[#2c2e35] flex items-center justify-center shadow-lg glow-mint">
            <CheckCircle2 className="w-6 h-6 text-[#2c2e35]" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">
              Compliance Gate Cleared • 4 of 4 Checks Verified
            </h4>
            <p className="text-xs text-[#89c07e] mt-0.5 font-mono">
              Cold-chain compliant (Y) • Route disruption-free • GDP certified • Donor solvent
            </p>
          </div>
        </div>

        <button
          onClick={onProceedToApproval}
          className="w-full md:w-auto px-6 py-3.5 rounded-2xl font-bold text-xs bg-gradient-to-r from-[#467750] via-[#89c07e] to-[#f0cd6e] text-[#2c2e35] shadow-xl shadow-[#467750]/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
        >
          <span>Proceed to Human Approval (Screen 5)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
