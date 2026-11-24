import React from 'react';
import { usePulseChain } from '../../context/PulseChainContext';
import ExternalRiskPanel from '../ExternalRiskPanel';
import CopyButton from '../common/CopyButton';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  DollarSign,
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
  const { user } = usePulseChain();

  const hospitalNames = {
    H001: 'Metro Health Central',
    H002: "St. Luke's Memorial",
    H003: 'Mercy General Medical',
    H004: 'Bhopal Apex Care Hospital',
    H005: 'Central Surplus Logistics Hub',
    H006: 'Valley Memorial Healthcare (Indore)',
  };
  const currentHospitalId = user?.hospitalId || user?.hospital_id || 'H004';
  const currentHospitalName = hospitalNames[currentHospitalId] || `${user?.city || 'Bhopal'} Apex Care Hospital`;

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
        total += deficitUnits * 120;
      }
    });
    return total > 0 ? total : 840000;
  }, [inventory, disruptionLength]);

  const alertsFeed = [
    {
      id: 1,
      severity: 'CRITICAL',
      title: 'Port of Rotterdam Maritime Disruption',
      timestamp: '12m ago',
      bullets: [
        'Container terminal halted due to severe North Sea storm surge',
        'Lead time extended by +12 Days across northern maritime corridors',
        'Primary affected cargo: Active Pharmaceutical Ingredients (API) & Insulin',
      ],
      icon: Ship,
    },
    {
      id: 2,
      severity: 'HIGH RISK',
      title: 'East District Highway Corridor Disrupted',
      timestamp: '34m ago',
      bullets: [
        'Interstate cold-chain trucks restricted by severe weather conditions',
        'Ground delivery to St. Luke\'s Memorial (H002) delayed',
        'Hospital stock cover rapidly depleting: 3 Days remaining',
      ],
      icon: Wind,
    },
    {
      id: 3,
      severity: 'COMPLIANCE',
      title: 'External Vendor Cold-Chain Violation',
      timestamp: '1h 15m ago',
      bullets: [
        'Vendor V1003 (Apex Critical Care) flagged for temperature excursion',
        'Storage temperature spiked to +11°C (Max allowable +4°C)',
        'Compliance status: "N" — Automatically rejected by agentic gateway',
      ],
      icon: ShieldAlert,
    },
    {
      id: 4,
      severity: 'READY',
      title: 'Central Hub H005 Emergency Reserve',
      timestamp: '2h ago',
      bullets: [
        'Hub H005 verified: 5,000+ emergency units in stock',
        'Reallocation velocity: 0 Days lead time via intraday courier',
        'Internal cold-chain route verified 100% compliant',
      ],
      icon: Zap,
    },
  ];

  return (
    <div className="space-y-5 text-abyss-text font-sans">
      {/* Hospital Manager Scoping Banner */}
      <div className="p-3.5 px-4 rounded-xl bg-abyss-card border border-sand-border flex flex-wrap items-center justify-between text-xs font-mono shadow-sm gap-2">
        <div className="flex items-center space-x-2 text-abyss-text">
          <Building2 className="w-4 h-4 text-volt" />
          <span className="font-bold">
            Managing: {currentHospitalId} — {currentHospitalName}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-sand-base text-sand-text font-bold">
            STRICT ERP SCOPE
          </span>
        </div>
        <div className="text-[11px] text-abyss-muted hidden sm:block">
          Tenant City: <strong className="text-abyss-text">{user?.city || 'BHOPAL'}</strong> • Authority:{' '}
          <strong className="text-volt">{user?.name || 'Dr. Kavya Rajoria'}</strong>
        </div>
      </div>

      {/* Screen Title Bento Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-abyss-card border border-sand-border shadow-sm">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded bg-abyss-elevated text-volt text-xs font-mono font-bold mb-2 border border-sand-border">
            <Radio className="w-3.5 h-3.5 text-volt animate-pulse" />
            <span>DISRUPTION SENSING ACTIVE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-abyss-text tracking-tight">
            Screen 1: Control Tower Overview
          </h2>
          <p className="text-xs text-abyss-muted mt-1 max-w-2xl leading-relaxed">
            Multi-echelon visibility across regional hospital facilities and global logistics corridors. Monitoring active disruption threshold of{' '}
            <strong className="text-volt font-mono">{disruptionLength} Days</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToScreen2}
          className="self-start md:self-center flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-volt text-volt-text hover:bg-volt-hover active:scale-[0.99] transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-[#FFD400]"
        >
          <span>Investigate Impact (Screen 2)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Top 3 Required KPI Bento Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Total Active Disruptions */}
        <div className="p-5 rounded-xl bg-abyss-card border border-sand-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-abyss-muted">
              Total Active Disruptions
            </span>
            <div className="p-2 rounded-lg bg-abyss-elevated text-volt border border-sand-border">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-black text-abyss-text font-mono">
              3 <span className="text-xs font-sans font-normal text-abyss-muted">Critical Events</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-volt-text bg-volt px-2 py-0.5 rounded uppercase">
              +12d Lead Time
            </span>
          </div>
          <p className="mt-2 text-xs text-abyss-muted flex items-center gap-1.5">
            <Ship className="w-3.5 h-3.5 text-volt" />
            <span>Port of Rotterdam closure is primary source</span>
          </p>
        </div>

        {/* KPI 2: High-Risk Locations (daysCover < disruptionLength) */}
        <div className="p-5 rounded-xl bg-abyss-card border border-sand-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-abyss-muted">
              High-Risk Facilities
            </span>
            <div className="p-2 rounded-lg bg-abyss-elevated text-volt border border-sand-border">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-black text-volt font-mono">
              {highRiskLocations.size}{' '}
              <span className="text-xs font-sans font-normal text-abyss-muted">Facilities</span>
            </div>
            <span className="text-[10px] font-mono text-volt bg-abyss-elevated px-2 py-0.5 rounded border border-sand-border">
              Cover &lt; 12d
            </span>
          </div>
          <p className="mt-2 text-xs text-abyss-muted flex items-center gap-1.5 truncate">
            <Building2 className="w-3.5 h-3.5 text-volt shrink-0" />
            <span className="truncate">
              Affected: {Array.from(highRiskLocations).slice(0, 4).join(', ')}
            </span>
          </p>
        </div>

        {/* KPI 3: Total Value at Risk */}
        <div className="p-5 rounded-xl bg-abyss-card border border-sand-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-abyss-muted">
              Total Value at Risk
            </span>
            <div className="p-2 rounded-lg bg-abyss-elevated text-volt border border-sand-border">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-black text-abyss-text font-mono tracking-tight">
              ₹{(totalValueAtRisk / 1000).toLocaleString()}k
            </div>
            <span className="text-[10px] font-mono text-abyss-text bg-sand-base px-2 py-0.5 rounded font-bold">
              INR Exposure
            </span>
          </div>
          <p className="mt-2 text-xs text-abyss-muted flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-volt" />
            <span>Cumulative stock deficit valuation</span>
          </p>
        </div>
      </div>

      {/* External Environmental & Logistics Sensing Radar (Open-Meteo + GDELT) */}
      <ExternalRiskPanel hospitalId="H004" city="BHOPAL" />

      {/* Disruption Feed & Live Operational Telemetry Bento Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Real-time Alert Feed with Concise Bullet Points (2 Columns) */}
        <div className="lg:col-span-2 rounded-xl bg-abyss-card border border-sand-border p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-sand-border">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-volt animate-pulse" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-abyss-text">
                Active Disruption Alerts & Intelligence
              </h3>
            </div>
            <span className="text-xs font-mono text-sand-text bg-sand-base px-2 py-0.5 rounded font-bold">
              Live Sensor Feed
            </span>
          </div>

          <div className="space-y-3">
            {alertsFeed.map((alert) => {
              const Icon = alert.icon;
              return (
                <div
                  key={alert.id}
                  className="p-4 rounded-xl border border-sand-border bg-abyss-elevated space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded bg-abyss-card text-volt border border-sand-border">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-abyss-text">
                        {alert.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sand-base text-sand-text font-bold">
                        {alert.severity}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-abyss-muted">
                      {alert.timestamp}
                    </span>
                  </div>

                  <ul className="space-y-1 text-xs text-abyss-muted pl-6">
                    {alert.bullets.map((bullet, idx) => (
                      <li key={idx} className="list-disc leading-relaxed">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real Network Operational Status */}
        <div className="rounded-xl bg-abyss-card border border-sand-border p-5 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-sand-border">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-abyss-text">
                <AlertTriangle className="w-4 h-4 text-volt" />
                <span>Facilities in Deficit Horizon</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-volt text-volt-text font-bold">
                &lt; {disruptionLength}d Cover
              </span>
            </div>

            <p className="text-xs text-abyss-muted leading-relaxed">
              Hospital facilities with insufficient stock to survive the 12-day lead time spike without intervention:
            </p>

            {/* Live Hospital Stock Deficit Rows */}
            <div className="space-y-2">
              {inventory
                .filter((item) => item.daysCover < disruptionLength)
                .slice(0, 4)
                .map((shortage, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-abyss-elevated border border-sand-border flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="font-bold text-abyss-text flex items-center space-x-1.5">
                        <span className="text-volt">{shortage.HOSPITAL_ID}</span>
                        <CopyButton text={shortage.HOSPITAL_ID} label="Copy Hospital ID" />
                        <span className="text-abyss-muted">•</span>
                        <span>{shortage.MATERIAL_ID}</span>
                      </div>
                      <div className="text-[10px] text-abyss-muted">
                        Stock: {shortage.STOCK_QTY} {shortage.UNIT} (Burn: {shortage.DAILY_USE}/d)
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-volt block">
                        {shortage.daysCover}d Cover
                      </span>
                      <span className="text-[10px] text-abyss-muted font-sans">
                        -{disruptionLength - shortage.daysCover}d Deficit
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="pt-4 border-t border-sand-border mt-4">
            <button
              type="button"
              onClick={onNavigateToScreen2}
              className="w-full py-2.5 px-4 rounded-xl bg-volt text-volt-text font-bold text-xs uppercase tracking-wide hover:bg-volt-hover active:scale-[0.99] transition-colors flex items-center justify-center space-x-2 shadow-sm focus-visible:ring-2 focus-visible:ring-[#FFD400]"
            >
              <span>Review Disruption Alerts (Step 2)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
