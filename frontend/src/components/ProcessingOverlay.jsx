import React, { useState, useEffect } from 'react';
import { Cpu, ShieldCheck, RefreshCw, Zap, Database, ArrowRight } from 'lucide-react';

/**
 * ProcessingOverlay
 * 3-Second High-Tech Autonomous Process Execution Screen
 * Uses user palette: #2c2e35, #2a3f3f, #467750, #89c07e, #e0e8e2, #f0cd6e
 */
export default function ProcessingOverlay({ isOpen, transferDetails, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);

  const STAGES = [
    {
      title: 'DISRUPTION SENSING',
      desc: 'Evaluating hospital burn rate and critical shortage threshold (< 5 days cover)...',
      icon: Cpu,
      color: '#f0cd6e',
    },
    {
      title: 'SAP RFC BAPI DISPATCH',
      desc: 'Invoking Function Module Z_PULSE_UPDATE_STOCK on Central Hub H005...',
      icon: Database,
      color: '#89c07e',
    },
    {
      title: 'INVENTORY BALANCING',
      desc: 'Reallocating 5-day safety buffer units & synchronizing ET_STOCK table...',
      icon: Zap,
      color: '#e0e8e2',
    },
    {
      title: 'TRANSFER FINALIZED',
      desc: 'Stock confirmed in SAP ledger. Refreshing live resilient dashboard...',
      icon: ShieldCheck,
      color: '#89c07e',
    },
  ];

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setStageIndex(0);
      return;
    }

    const duration = 3000; // 3 seconds
    const intervalTime = 30; // 30ms step
    const stepIncrement = (100 / (duration / intervalTime));

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + stepIncrement;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 200);
          return 100;
        }

        // Update stage based on progress
        if (next < 30) setStageIndex(0);
        else if (next < 65) setStageIndex(1);
        else if (next < 90) setStageIndex(2);
        else setStageIndex(3);

        return next;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  const currentStage = STAGES[stageIndex];
  const StageIcon = currentStage.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#181a1f]/85 backdrop-blur-2xl animate-in fade-in duration-300">
      {/* Ambient background glows with user palette */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#467750]/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[#f0cd6e]/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-xl rounded-3xl p-8 bg-[#2c2e35]/90 border border-[#e0e8e2]/20 shadow-2xl shadow-black/80 space-y-6 text-center overflow-hidden">
        {/* Top Gold & Mint Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#467750] via-[#89c07e] to-[#f0cd6e]"></div>

        {/* PulseChain Logo Header */}
        <div className="flex justify-center">
          <div className="p-2 rounded-2xl bg-white/95 shadow-md shadow-[#467750]/30 ring-1 ring-[#f0cd6e]/40 inline-flex items-center space-x-2">
            <img src="/pulsechain-logo.png" alt="PulseChain Logo" className="h-9 w-auto object-contain" />
            <span className="text-xs font-black text-[#2c2e35] uppercase tracking-wider pr-1">PulseChain SAP Agent</span>
          </div>
        </div>

        {/* Central Rotating Quantum Portal */}
        <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
          {/* Outer Gold Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#f0cd6e]/40 animate-spin-slow"></div>

          {/* Inner Mint Ring */}
          <div className="absolute inset-2 rounded-full border-2 border-[#89c07e]/60 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '4s' }}></div>

          {/* Central Beacon */}
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#2a3f3f] to-[#467750] border border-[#89c07e]/50 shadow-lg glow-mint">
            <StageIcon className="w-8 h-8 text-[#f0cd6e] animate-pulse" />
          </div>
        </div>

        {/* Title & Diagnostic Step */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#2a3f3f]/80 border border-[#89c07e]/40 text-xs font-mono font-semibold text-[#89c07e]">
            <span className="w-2 h-2 rounded-full bg-[#f0cd6e] animate-ping"></span>
            <span>AUTONOMOUS AGENT ACTIVE • 3s PROTOCOL</span>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-[#e0e8e2]">
            Executing SAP Stock Reallocation
          </h3>
          <p className="text-xs font-mono text-[#f0cd6e] tracking-wider uppercase font-semibold">
            {currentStage.title} ({Math.round(progress)}%)
          </p>
          <p className="text-xs text-[#e0e8e2]/70 max-w-md mx-auto leading-relaxed">
            {currentStage.desc}
          </p>
        </div>

        {/* Active Transfer Details Pill */}
        {transferDetails && (
          <div className="p-3.5 rounded-2xl bg-[#2a3f3f]/50 border border-[#e0e8e2]/10 flex items-center justify-between text-xs font-mono">
            <div className="text-left">
              <span className="text-slate-400 block text-[10px] uppercase">Surplus Source</span>
              <span className="font-bold text-[#89c07e]">{transferDetails.fromHospital || 'Hub H005'}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[#f0cd6e] font-bold">
              <span>{transferDetails.qty} Units</span>
              <ArrowRight className="w-4 h-4" />
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase">Distressed Facility</span>
              <span className="font-bold text-[#f0cd6e]">{transferDetails.toHospital}</span>
            </div>
          </div>
        )}

        {/* 3-Second Progress Bar */}
        <div className="space-y-2 pt-2">
          <div className="w-full bg-[#2a3f3f] h-3 rounded-full overflow-hidden p-0.5 border border-[#e0e8e2]/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#467750] via-[#89c07e] to-[#f0cd6e] transition-all duration-75 shadow-md"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>RFC Call: Z_PULSE_UPDATE_STOCK</span>
            <span className="text-[#f0cd6e] font-bold">{Math.round((3000 * (100 - progress)) / 1000) / 10}s remaining</span>
          </div>
        </div>
      </div>
    </div>
  );
}

