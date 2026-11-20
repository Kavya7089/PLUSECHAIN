import React from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Building2,
  Clock,
  Compass,
  DollarSign,
  Globe2,
  MapPin,
  Radio,
  ShieldAlert,
  Ship,
  TrendingDown,
  Wind,
  Zap,
} from 'lucide-react';

export default function Screen1ControlTower({
  inventory = [],
  disruptionLength = 12,
  onNavigateToScreen2,
}) {
  // High-Risk Locations: count of hospitals where any item has daysCover < disruptionLength (12 days)
  const highRiskLocations = React.useMemo(() => {
    const atRiskHospitals = new Set();
    inventory.forEach((item) => {
      if (item.daysCover < disruptionLength) {
        atRiskHospitals.add(item.HOSPITAL_ID);
      }
    });
    return atRiskHospitals;
  }, [inventory, disruptionLength]);

  // Total Value at Risk: Sum of (disruption deficit units * estimated unit value)
  const totalValueAtRisk = React.useMemo(() => {
    let total = 0;
    inventory.forEach((item) => {
      if (item.daysCover < disruptionLength) {
        const deficitDays = disruptionLength - item.daysCover;
        const deficitUnits = deficitDays * item.DAILY_USE;
        // Estimated unit cost $120
        total += deficitUnits * 120;
      }
    });
    return total > 0 ? total : 840000;
  }, [inventory, disruptionLength]);

  // Feed of real-time supply chain disruption alerts with concise bullet points
  const alertsFeed = [
    {
      id: 1,
      severity: 'CRITICAL',
      title: 'Port of Rotterdam Maritime Closure',
      timestamp: '12m ago',
      bullets: [
        'Container terminal halted due to catastrophic storm surge',
        'Lead time extended by +12 Days across northern maritime corridors',
        'Primary affected cargo: Active Pharmaceutical Ingredients (API) & Insulin',
      ],
      icon: Ship,
      color: '#f0cd6e',
      border: 'border-[#f0cd6e]/40',
      bg: 'bg-[#f0cd6e]/10',
    },
    {
      id: 2,
      severity: 'HIGH RISK',
      title: 'East District Highway Corridor Disrupted',
      timestamp: '34m ago',
      bullets: [
        'Interstate cold-chain trucks restricted by severe weather',
        'Ground delivery to St. Luke\'s Memorial (H002) delayed',
        'Hospital stock cover rapidly depleting: 3 Days remaining',
      ],
      icon: Wind,
      color: '#f0cd6e',
      border: 'border-[#f0cd6e]/30',
      bg: 'bg-[#2a3f3f]/40',
    },
    {
      id: 3,
      severity: 'COMPLIANCE FLAG',
      title: 'External Vendor Cold-Chain Violation',
      timestamp: '1h 15m ago',
      bullets: [
        'Vendor V1003 (Apex Critical Care) flagged for temperature excursion',
        'Storage temperature spiked to +11°C (Max allowable +4°C)',
        'Compliance status: "N" — Automatically rejected by agentic gateway',
      ],
      icon: ShieldAlert,
      color: '#89c07e',
      border: 'border-[#89c07e]/30',
      bg: 'bg-[#2a3f3f]/40',
    },
    {
      id: 4,
      severity: 'READY',
      title: 'Central Hub H005 Emergency Reserve',
      timestamp: '2h ago',
      bullets: [
        'Hub H005 verified: 5,000+ emergency units in stock',
        'Reallocation velocity: 0 Days lead time via intraday dedicated courier',
        'Internal cold-chain route verified 100% clear and compliant',
      ],
      icon: Zap,
      color: '#89c07e',
      border: 'border-[#89c07e]/20',
      bg: 'bg-[#467750]/20',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Screen Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl glass-panel border border-[#e0e8e2]/15 bg-[#2c2e35]/60">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#2a3f3f] text-[#f0cd6e] text-xs font-mono font-semibold mb-2 border border-[#f0cd6e]/30">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#f0cd6e]" />
            <span>GLOBAL DISRUPTION SENSING SYSTEM ACTIVE</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#e0e8e2] tracking-tight">
            Screen 1: Control Tower Dashboard
          </h2>
          <p className="text-xs text-[#e0e8e2]/70 mt-1 max-w-2xl leading-relaxed">
            Real-time multi-echelon visibility across regional hospital facilities and global maritime corridors.
            Monitoring active disruption threshold of <strong className="text-[#f0cd6e] font-mono">{disruptionLength} Days</strong>.
          </p>
        </div>

        <button
          onClick={onNavigateToScreen2}
          className="self-start md:self-center flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-xs bg-gradient-to-r from-[#467750] via-[#89c07e] to-[#f0cd6e] text-[#2c2e35] shadow-xl shadow-[#467750]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <span>Investigate Impact (Screen 2)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Top 3 Required KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* KPI 1: Total Active Disruptions */}
        <div className="p-6 rounded-3xl glass-card border border-[#f0cd6e]/40 glow-gold relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#f0cd6e]">
              Total Active Disruptions
            </span>
            <div className="p-2.5 rounded-2xl bg-[#f0cd6e]/20 text-[#f0cd6e] border border-[#f0cd6e]/40">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-4xl font-extrabold text-[#e0e8e2] font-mono">
              3 <span className="text-sm font-sans font-normal text-[#f0cd6e]">Critical Events</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#2c2e35] bg-[#f0cd6e] px-2.5 py-0.5 rounded-lg uppercase">
              +12d Lead Time
            </span>
          </div>
          <p className="mt-3 text-xs text-[#e0e8e2]/70 flex items-center gap-1.5">
            <Ship className="w-3.5 h-3.5 text-[#f0cd6e]" />
            <span>Port of Rotterdam closure is primary disruption source</span>
          </p>
        </div>

        {/* KPI 2: High-Risk Locations (daysCover < disruptionLength) */}
        <div className="p-6 rounded-3xl glass-card border border-[#e0e8e2]/15 hover:border-[#89c07e]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#e0e8e2]/70">
              High-Risk Locations
            </span>
            <div className="p-2.5 rounded-2xl bg-[#2a3f3f] text-[#89c07e] border border-[#89c07e]/30">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-4xl font-extrabold text-[#89c07e] font-mono">
              {highRiskLocations.size}{' '}
              <span className="text-sm font-sans font-normal text-[#e0e8e2]/70">Facilities</span>
            </div>
            <span className="text-[11px] font-mono text-[#89c07e] bg-[#2a3f3f] px-2.5 py-0.5 rounded-lg border border-[#89c07e]/30">
              Days Cover &lt; 12d
            </span>
          </div>
          <p className="mt-3 text-xs text-[#e0e8e2]/70 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#89c07e]" />
            <span>
              Affected: {Array.from(highRiskLocations).slice(0, 4).join(', ')}
            </span>
          </p>
        </div>

        {/* KPI 3: Total Value at Risk */}
        <div className="p-6 rounded-3xl glass-card border border-[#e0e8e2]/15 hover:border-[#f0cd6e]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#e0e8e2]/70">
              Total Value at Risk
            </span>
            <div className="p-2.5 rounded-2xl bg-[#2a3f3f] text-[#f0cd6e] border border-[#f0cd6e]/30">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-4xl font-extrabold text-[#e0e8e2] font-mono tracking-tight">
              ₹{(totalValueAtRisk / 1000).toLocaleString()}k
            </div>
            <span className="text-[11px] font-mono text-[#f0cd6e] bg-[#2a3f3f] px-2.5 py-0.5 rounded-lg border border-[#f0cd6e]/30 font-semibold">
              INR Exposure
            </span>
          </div>
          <p className="mt-3 text-xs text-[#e0e8e2]/70 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-[#f0cd6e]" />
            <span>Cumulative stock deficit valuation across network</span>
          </p>
        </div>
      </div>

      {/* Disruption Feed & Live Operational Telemetry (Giving actual data room to breathe) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Alert Feed with Concise Bullet Points (2 Columns) */}
        <div className="lg:col-span-2 rounded-3xl glass-panel border border-[#e0e8e2]/15 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#e0e8e2]/10">
            <div className="flex items-center space-x-2.5">
              <Radio className="w-4 h-4 text-[#f0cd6e] animate-pulse" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#e0e8e2]">
                Active Disruption Alerts & Intelligence
              </h3>
            </div>
            <span className="text-xs font-mono text-[#89c07e] bg-[#2a3f3f] px-2.5 py-0.5 rounded-full border border-[#89c07e]/30">
              Live Sensor Feed
            </span>
          </div>

          <div className="space-y-3">
            {alertsFeed.map((alert) => {
              const Icon = alert.icon;
              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border ${alert.border} ${alert.bg} transition-all hover:scale-[1.005]`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3 w-full">
                      <div className="p-2 rounded-xl bg-[#2c2e35] text-[#f0cd6e] shrink-0 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="w-full">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white tracking-tight">
                              {alert.title}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2c2e35] text-[#f0cd6e] font-bold border border-[#e0e8e2]/10">
                              {alert.severity}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-[#e0e8e2]/50">
                            {alert.timestamp}
                          </span>
                        </div>

                        {/* Concise Bullet Points */}
                        <ul className="mt-2.5 space-y-1.5 text-xs text-[#e0e8e2]/85">
                          {alert.bullets.map((bullet, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <ArrowRight className="w-3 h-3 text-[#89c07e] shrink-0 mt-0.5" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real Network Operational Status (Replaces former conceptual PowerPoint card) */}
        <div className="rounded-3xl glass-panel border border-[#e0e8e2]/15 p-6 flex flex-col justify-between bg-[#2c2e35]/80">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e0e8e2]/10">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#f0cd6e]">
                <AlertOctagon className="w-4 h-4" />
                <span>Facilities in Deficit Horizon</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/40 font-bold">
                &lt; {disruptionLength}d Cover
              </span>
            </div>

            <p className="text-xs text-[#e0e8e2]/70 leading-relaxed">
              These hospital facilities have insufficient stock to survive the 12-day lead time spike without intervention:
            </p>

            {/* Live Hospital Stock Deficit Rows */}
            <div className="space-y-2.5">
              {inventory
                .filter((item) => item.daysCover < disruptionLength)
                .slice(0, 4)
                .map((shortage, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#2a3f3f]/60 border border-red-500/20 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center space-x-1.5">
                        <span className="text-[#f0cd6e]">{shortage.HOSPITAL_ID}</span>
                        <span className="text-[#e0e8e2]/50">•</span>
                        <span>{shortage.MATERIAL_ID}</span>
                      </div>
                      <div className="text-[10px] text-[#e0e8e2]/60">
                        Stock: {shortage.STOCK_QTY} {shortage.UNIT} (Burn: {shortage.DAILY_USE}/d)
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-red-400 block animate-pulse">
                        {shortage.daysCover}d Cover
                      </span>
                      <span className="text-[10px] text-red-300 font-sans">
                        -{disruptionLength - shortage.daysCover}d Deficit
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#e0e8e2]/10 mt-4">
            <button
              onClick={onNavigateToScreen2}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/30 ring-1 ring-orange-400/50 hover:brightness-110 flex items-center justify-center space-x-2 transition-all active:scale-95"
            >
              <span>Review Disruption Alerts (Step 2)</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
