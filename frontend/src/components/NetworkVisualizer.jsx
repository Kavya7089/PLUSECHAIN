import React from 'react';
import { Hospital, ShieldAlert, CheckCircle2, TrendingUp, ArrowRightLeft } from 'lucide-react';
import { HOSPITAL_METADATA, MEDICINE_METADATA } from '../utils/inventoryHelper';

export default function NetworkVisualizer({ inventory = [] }) {
  // Aggregate by hospital
  const hospitalSummaries = React.useMemo(() => {
    const map = {};
    inventory.forEach((item) => {
      if (!map[item.HOSPITAL_ID]) {
        map[item.HOSPITAL_ID] = {
          hospitalId: item.HOSPITAL_ID,
          totalStock: 0,
          totalBurn: 0,
          criticalCount: 0,
          surplusCount: 0,
          items: [],
        };
      }
      map[item.HOSPITAL_ID].totalStock += item.STOCK_QTY;
      map[item.HOSPITAL_ID].totalBurn += item.DAILY_USE;
      if (item.daysCover < 5) map[item.HOSPITAL_ID].criticalCount++;
      if (item.daysCover >= 10) map[item.HOSPITAL_ID].surplusCount++;
      map[item.HOSPITAL_ID].items.push(item);
    });
    return Object.values(map);
  }, [inventory]);

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
            Healthcare Facility Network Resilience Map
          </h3>
          <p className="text-xs text-slate-400">
            Real-time supply status across distributed regional health centers
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center gap-1.5 text-red-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Disruption Identified
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Surplus Donor Ready
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
        {hospitalSummaries.map((h) => {
          const info = HOSPITAL_METADATA[h.hospitalId] || { name: h.hospitalId, region: 'Network' };
          const hasCritical = h.criticalCount > 0;
          const hasSurplus = h.surplusCount > 0;

          return (
            <div
              key={h.hospitalId}
              className={`p-4 rounded-xl border transition-all ${
                hasCritical
                  ? 'bg-red-950/20 border-red-500/40 shadow-sm shadow-red-950'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                  {h.hospitalId}
                </span>
                {hasCritical ? (
                  <span className="text-[10px] font-bold text-red-300 bg-red-900/70 px-2 py-0.5 rounded-full border border-red-600/50 flex items-center gap-1 animate-pulse">
                    <ShieldAlert className="w-2.5 h-2.5" /> Shortage
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Stable
                  </span>
                )}
              </div>

              <div className="font-medium text-white text-xs truncate" title={info.name}>
                {info.name}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{info.region}</div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Total Stock:</span>
                <span className="font-bold text-white">{h.totalStock.toLocaleString()}</span>
              </div>

              <div className="mt-1 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Disruptions:</span>
                <span className={`font-bold ${hasCritical ? 'text-red-400' : 'text-slate-500'}`}>
                  {h.criticalCount}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

