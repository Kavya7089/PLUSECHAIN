import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  ArrowUpDown,
  Hospital,
  Pill,
  Sparkles,
} from 'lucide-react';
import { MEDICINE_METADATA, HOSPITAL_METADATA } from '../utils/inventoryHelper';

export default function InventoryTable({
  inventory = [],
  onExecuteReallocation,
  activeFilter = 'all',
  setActiveFilter,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('daysCover');
  const [sortAsc, setSortAsc] = useState(true);

  // Filter & Search processing
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      // Search matching
      const matchesSearch =
        item.HOSPITAL_ID.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.MATERIAL_ID.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (MEDICINE_METADATA[item.MATERIAL_ID]?.name || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (HOSPITAL_METADATA[item.HOSPITAL_ID]?.name || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Tab filters
      if (activeFilter === 'critical') {
        return item.daysCover < 5;
      }
      if (activeFilter === 'buffer') {
        return item.daysCover >= 5 && item.daysCover < 10;
      }
      if (activeFilter === 'surplus') {
        return item.daysCover >= 10;
      }
      return true;
    });
  }, [inventory, searchQuery, activeFilter]);

  // Sorting
  const sortedInventory = useMemo(() => {
    return [...filteredInventory].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
  }, [filteredInventory, sortField, sortAsc]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/40">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Hospital Inventory & Structural Disruption Monitor
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
              {filteredInventory.length} of {inventory.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time feed from SAP RFC Function Module{' '}
            <code className="text-cyan-400 font-mono">Z_PULSE_GET_STOCK</code> (Output Table:{' '}
            <code className="text-cyan-400 font-mono">ET_STOCK</code>)
          </p>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Filter Tabs */}
          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setActiveFilter('critical')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeFilter === 'critical'
                  ? 'bg-red-950 text-red-200 border border-red-800/60 shadow-sm'
                  : 'text-red-400/80 hover:text-red-300'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-400"></span>
              Critical (&lt;5d)
            </button>
            <button
              onClick={() => setActiveFilter('surplus')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeFilter === 'surplus'
                  ? 'bg-emerald-950 text-emerald-200 border border-emerald-800/60 shadow-sm'
                  : 'text-emerald-400/80 hover:text-emerald-300'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              Surplus (&gt;10d)
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Hospital or Material..."
              className="w-56 pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {/* Hospital ID */}
              <th
                onClick={() => toggleSort('HOSPITAL_ID')}
                className="py-3.5 px-5 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <Hospital className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Hospital ID</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>

              {/* Medicine ID */}
              <th
                onClick={() => toggleSort('MATERIAL_ID')}
                className="py-3.5 px-5 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <Pill className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Medicine ID</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>

              {/* Stock Qty */}
              <th
                onClick={() => toggleSort('STOCK_QTY')}
                className="py-3.5 px-5 text-right cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end space-x-1.5">
                  <span>Stock Qty</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>

              {/* Daily Use */}
              <th
                onClick={() => toggleSort('DAILY_USE')}
                className="py-3.5 px-5 text-right cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end space-x-1.5">
                  <span>Daily Use</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>

              {/* Unit */}
              <th className="py-3.5 px-4 text-center">Unit</th>

              {/* Days of Cover */}
              <th
                onClick={() => toggleSort('daysCover')}
                className="py-3.5 px-5 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Days of Cover</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>

              {/* Risk Sensing Status & Agentic Action */}
              <th className="py-3.5 px-5 text-center">Risk Status & Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 text-sm">
            {sortedInventory.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Filter className="w-8 h-8 text-slate-600" />
                    <p className="text-sm">No inventory records matching your query.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setActiveFilter('all');
                      }}
                      className="text-xs text-cyan-400 hover:underline"
                    >
                      Clear search filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              sortedInventory.map((item, index) => {
                const isCritical = item.daysCover < 5;
                const isSurplus = item.daysCover >= 10;
                const hospitalInfo = HOSPITAL_METADATA[item.HOSPITAL_ID] || {
                  name: `Facility ${item.HOSPITAL_ID}`,
                  region: 'General Network',
                  tier: 'Regional Facility',
                };
                const medicineInfo = MEDICINE_METADATA[item.MATERIAL_ID] || {
                  name: `Material ${item.MATERIAL_ID}`,
                  category: 'Medical Supply',
                  dosage: item.UNIT,
                };

                return (
                  <tr
                    key={`${item.HOSPITAL_ID}-${item.MATERIAL_ID}-${index}`}
                    className={`transition-all duration-200 group ${
                      isCritical
                        ? 'bg-red-950/30 hover:bg-red-950/50 border-l-4 border-l-red-500 shadow-inner'
                        : isSurplus
                        ? 'bg-slate-900/20 hover:bg-slate-800/40 border-l-4 border-l-emerald-500/50'
                        : 'bg-transparent hover:bg-slate-900/50 border-l-4 border-l-transparent'
                    }`}
                  >
                    {/* Hospital ID */}
                    <td className="py-4 px-5">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-mono font-bold text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-700/80">
                          {item.HOSPITAL_ID}
                        </span>
                        <div>
                          <div className="font-medium text-slate-200 text-xs sm:text-sm">
                            {hospitalInfo.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {hospitalInfo.region} • {hospitalInfo.tier}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Medicine ID */}
                    <td className="py-4 px-5">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-mono font-semibold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40 text-xs">
                          {item.MATERIAL_ID}
                        </span>
                        <div>
                          <div className="font-medium text-white text-xs sm:text-sm">
                            {medicineInfo.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {medicineInfo.category} • {medicineInfo.dosage}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Stock Qty */}
                    <td className="py-4 px-5 text-right font-mono font-bold text-slate-100 text-base">
                      {item.STOCK_QTY.toLocaleString()}
                    </td>

                    {/* Daily Use */}
                    <td className="py-4 px-5 text-right font-mono text-slate-300">
                      {item.DAILY_USE.toLocaleString()}{' '}
                      <span className="text-[10px] text-slate-500 font-sans">/day</span>
                    </td>

                    {/* Unit */}
                    <td className="py-4 px-4 text-center">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
                        {item.UNIT}
                      </span>
                    </td>

                    {/* Days of Cover */}
                    <td className="py-4 px-5">
                      <div className="space-y-1.5 min-w-[130px]">
                        <div className="flex items-baseline justify-between">
                          <span
                            className={`font-mono text-base font-extrabold ${
                              isCritical
                                ? 'text-red-400 animate-pulse'
                                : isSurplus
                                ? 'text-emerald-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {item.daysCover}{' '}
                            <span className="text-xs font-normal text-slate-400 font-sans">
                              {item.daysCover === 1 ? 'day' : 'days'}
                            </span>
                          </span>

                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.STOCK_QTY}/{item.DAILY_USE}
                          </span>
                        </div>

                        {/* Progress Bar Gauge */}
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCritical
                                ? 'bg-gradient-to-r from-red-600 to-rose-500'
                                : isSurplus
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-400'
                                : 'bg-gradient-to-r from-amber-600 to-yellow-400'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(8, (item.daysCover / 20) * 100))}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Risk Sensing & Agentic Action Button */}
                    <td className="py-4 px-5 text-center">
                      {isCritical ? (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                          {/* Warning Badge: Structural Disruption */}
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-900/60 text-red-200 border border-red-500/60 shadow-sm animate-pulse">
                            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                            <span>Structural Disruption</span>
                          </div>

                          {/* Agentic Action Button */}
                          <button
                            onClick={() => onExecuteReallocation(item)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg shadow-red-600/30 ring-1 ring-red-400/50 hover:scale-105 active:scale-95 transition-all duration-150"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
                            <span>Execute Reallocation</span>
                          </button>
                        </div>
                      ) : isSurplus ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-600/40">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Surplus Donor (&gt;10d)</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/50 text-amber-300 border border-amber-600/30">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Buffer Monitored (5-9d)</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Summary Bar */}
      <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            Critical Risk: &lt; 5 Days
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Buffer: 5 - 9 Days
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Surplus Donor: &ge; 10 Days
          </span>
        </div>
        <div className="font-mono text-slate-400">
          Algorithm: <code className="text-cyan-400">Math.floor(STOCK_QTY / DAILY_USE)</code>
        </div>
      </div>
    </div>
  );
}

