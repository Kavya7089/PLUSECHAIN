import React from 'react';
import {
  Activity,
  AlertOctagon,
  BrainCircuit,
  CheckSquare,
  ChevronRight,
  Database,
  LayoutDashboard,
  Radio,
  Server,
  ShieldCheck,
  Truck,
  Zap,
} from 'lucide-react';

export default function Sidebar({
  activeScreen,
  setActiveScreen,
  criticalCount = 0,
  selectedPlan,
  isCompliancePassed,
}) {
  const navItems = [
    {
      id: 1,
      title: '1. Dashboard',
      subtitle: 'Overview & Disruption Radar',
      icon: LayoutDashboard,
      badge: 'Radar',
      badgeColor: 'bg-[#2a3f3f] text-[#89c07e] border-[#89c07e]/30',
    },
    {
      id: 2,
      title: '2. Disruption Alerts',
      subtitle: 'Shortages (< 12d Cover)',
      icon: AlertOctagon,
      badge: criticalCount > 0 ? `${criticalCount} At Risk` : 'Stable',
      badgeColor: criticalCount > 0 ? 'bg-[#f0cd6e] text-[#2c2e35] font-bold' : 'bg-[#2a3f3f] text-[#89c07e]',
    },
    {
      id: 3,
      title: '3. AI Scenario Planner',
      subtitle: 'Transfer vs. Purchase',
      icon: BrainCircuit,
      badge: selectedPlan ? selectedPlan.type : 'AI Engine',
      badgeColor: 'bg-[#2a3f3f] text-[#f0cd6e] border-[#f0cd6e]/30',
    },
    {
      id: 4,
      title: '4. Compliance Check',
      subtitle: 'Cold-Chain Validation',
      icon: ShieldCheck,
      badge: isCompliancePassed ? 'Verified' : 'Pending',
      badgeColor: isCompliancePassed ? 'bg-[#467750] text-[#e0e8e2]' : 'bg-[#2a3f3f] text-[#e0e8e2]/60',
    },
    {
      id: 5,
      title: '5. Human Approval',
      subtitle: 'SAP ERP Execution',
      icon: CheckSquare,
      badge: 'Authorize',
      badgeColor: 'bg-[#f0cd6e]/20 text-[#f0cd6e] border-[#f0cd6e]/40 font-bold',
    },
    {
      id: 6,
      title: '6. Supplier Directory',
      subtitle: 'Rates & Transfer Duration',
      icon: Truck,
      badge: 'Vendors',
      badgeColor: 'bg-[#2a3f3f] text-[#89c07e] border-[#89c07e]/40 font-semibold',
    },
  ];

  return (
    <aside className="w-72 shrink-0 glass-panel border-r border-[#e0e8e2]/10 bg-[#2c2e35]/80 backdrop-blur-2xl flex flex-col h-screen sticky top-0 z-30 transition-all">
      {/* Brand & Identity with Official PulseChain Logo */}
      <div className="p-5 border-b border-[#e0e8e2]/10 flex items-center space-x-3.5">
        <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-white/95 p-1.5 shadow-lg shadow-[#467750]/30 ring-1 ring-[#f0cd6e]/50 shrink-0">
          <img
            src="/pulsechain-logo.png"
            alt="PulseChain Logo"
            className="w-full h-full object-contain"
          />
          <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#89c07e] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#89c07e] ring-2 ring-[#2c2e35]"></span>
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-1.5">
            <h1 className="text-lg font-black tracking-tight text-[#e0e8e2]">PulseChain</h1>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#2a3f3f] text-[#f0cd6e] border border-[#f0cd6e]/40 font-bold">
              AI 2.5
            </span>
          </div>
          <p className="text-[11px] text-[#e0e8e2]/60 font-mono tracking-tight truncate">
            Autonomous Supply Tower
          </p>
        </div>
      </div>

      {/* Disruption Alert Beacon */}
      <div className="mx-4 my-4 p-3 rounded-2xl bg-[#f0cd6e]/10 border border-[#f0cd6e]/30 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Radio className="w-4 h-4 text-[#f0cd6e] animate-pulse" />
          <div>
            <div className="text-[11px] font-bold text-[#f0cd6e] tracking-tight">Active Disruption</div>
            <div className="text-[10px] text-[#e0e8e2]/70">Port of Rotterdam: +12d Lead Time</div>
          </div>
        </div>
      </div>

      {/* 5-Screen Workflow Navigation List */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] uppercase font-bold text-[#e0e8e2]/40 tracking-wider px-3 mb-2">
          Resilience Workflow Pipeline
        </div>
        {navItems.map((item) => {
          const isActive = activeScreen === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-[#467750]/70 to-[#2a3f3f]/90 border border-[#89c07e]/40 shadow-lg glow-mint'
                  : 'hover:bg-[#2a3f3f]/40 border border-transparent text-[#e0e8e2]/70 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-[#f0cd6e] text-[#2c2e35] shadow-md font-bold'
                      : 'bg-[#2a3f3f]/70 text-[#89c07e] border border-[#e0e8e2]/10 group-hover:border-[#89c07e]/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-xs font-bold tracking-tight ${
                        isActive ? 'text-white font-extrabold' : 'text-[#e0e8e2]'
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#e0e8e2]/60 truncate max-w-[130px]">
                    {item.subtitle}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isActive ? 'text-[#f0cd6e] translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </nav>

      {/* SAP ERP Connection Footer Status */}
      <div className="p-4 mx-4 mb-4 rounded-2xl bg-[#2a3f3f]/50 border border-[#e0e8e2]/10 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#e0e8e2]/60">
            SAP S/4HANA Connection
          </span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#89c07e] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#89c07e]"></span>
          </span>
        </div>
        <div className="flex items-center space-x-2 text-[11px] font-mono text-[#89c07e]">
          <Database className="w-3.5 h-3.5 text-[#89c07e]" />
          <span>Connected: S4H_CL100</span>
        </div>
        <div className="text-[10px] text-[#e0e8e2]/50 font-mono mt-0.5">
          RFC: Z_PULSE_GET_STOCK
        </div>
      </div>
    </aside>
  );
}
