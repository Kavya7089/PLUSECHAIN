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
  ShieldCheck,
  Truck,
  Users,
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
    },
    {
      id: 2,
      title: '2. Disruption Alerts',
      subtitle: 'Shortages (< 12d Cover)',
      icon: AlertOctagon,
      badge: criticalCount > 0 ? `${criticalCount} At Risk` : 'Stable',
      isCritical: criticalCount > 0,
    },
    {
      id: 3,
      title: '3. AI Scenario Planner',
      subtitle: 'Transfer vs. Purchase',
      icon: BrainCircuit,
      badge: selectedPlan ? selectedPlan.type : 'AI Engine',
    },
    {
      id: 4,
      title: '4. Compliance Check',
      subtitle: 'Cold-Chain Validation',
      icon: ShieldCheck,
      badge: isCompliancePassed ? 'Verified' : 'Pending',
    },
    {
      id: 5,
      title: '5. Human Approval',
      subtitle: 'SAP ERP Execution',
      icon: CheckSquare,
      badge: 'Authorize',
    },
    {
      id: 6,
      title: '6. Supplier Directory',
      subtitle: 'Rates & Transfer Duration',
      icon: Truck,
      badge: 'Vendors',
    },
    {
      id: 7,
      title: '7. Staff Directory',
      subtitle: 'SAP UserSet & Roster',
      icon: Users,
      badge: 'UserSet',
    },
  ];

  return (
    <aside className="w-72 shrink-0 border-r border-sand-border bg-abyss-card/85 backdrop-blur-xl flex flex-col h-screen sticky top-0 z-30 transition-colors print:hidden shadow-xl">
      {/* Brand & Identity */}
      <div className="p-4 border-b border-sand-border flex items-center space-x-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-abyss-elevated border border-sand-border overflow-hidden p-1 shadow-xs">
          <img
            src="/pulsechain-logo.png"
            alt="PulseChain Control Tower Emblem"
            width="32"
            height="32"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-1.5">
            <span className="text-base font-bold tracking-tight text-abyss-text">PulseChain</span>
          </div>
          <p className="text-[11px] text-abyss-muted font-mono tracking-tight truncate">
            Control Tower v3.2
          </p>
        </div>
      </div>

      {/* Disruption Alert Status Banner */}
      <div className="mx-3 my-3 p-3 rounded-xl bg-abyss-elevated border border-sand-border flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <Radio className="w-4 h-4 text-volt shrink-0 animate-pulse" />
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-abyss-text">Active Disruption</div>
            <div className="text-[10px] text-abyss-muted truncate">Port of Rotterdam: +12d Lead Time</div>
          </div>
        </div>
      </div>

      {/* 5-Screen Workflow Navigation List */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase font-bold text-abyss-muted tracking-wider px-2 py-1.5">
          Resilience Workflow Pipeline
        </div>
        {navItems.map((item) => {
          const isActive = activeScreen === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveScreen(item.id)}
              className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-colors group focus-visible:ring-2 focus-visible:ring-[#FFD400] ${
                isActive
                  ? 'bg-volt text-volt-text font-bold shadow-sm'
                  : 'text-abyss-text hover:bg-abyss-elevated'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#081F20] text-volt'
                      : 'bg-abyss-elevated text-abyss-muted border border-sand-border group-hover:text-abyss-text'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">
                    {item.title}
                  </div>
                  <div
                    className={`text-[10px] truncate ${
                      isActive ? 'text-volt-text/80' : 'text-abyss-muted'
                    }`}
                  >
                    {item.subtitle}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0 ml-1">
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                    isActive
                      ? 'bg-[#081F20] text-volt border-transparent font-bold'
                      : item.isCritical
                      ? 'bg-volt/15 text-volt border-volt/40 font-bold'
                      : 'bg-abyss-elevated text-abyss-muted border-sand-border'
                  }`}
                >
                  {item.badge}
                </span>
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isActive ? 'text-volt-text translate-x-0.5' : 'text-abyss-muted opacity-0 group-hover:opacity-100'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </nav>

      {/* SAP ERP Connection Footer Status */}
      <div className="p-3 mx-3 mb-3 rounded-xl bg-abyss-elevated border border-sand-border text-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-abyss-muted">
            SAP S/4HANA Connection
          </span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-volt opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-volt"></span>
          </span>
        </div>
        <div className="flex items-center space-x-1.5 text-[11px] font-mono text-abyss-text">
          <Database className="w-3.5 h-3.5 text-volt" />
          <span>Connected: ZPLUSE_SRV</span>
        </div>
        <div className="text-[10px] text-abyss-muted font-mono mt-0.5">
          Client: 105 • OData v2 Live
        </div>
      </div>
    </aside>
  );
}
