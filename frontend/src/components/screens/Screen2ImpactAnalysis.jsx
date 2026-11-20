import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Pill,
  Search,
  Sparkles,
} from 'lucide-react';

const MEDICINE_NAMES = {
  INS001: 'Insulin Glargine (100 U/mL)',
  AMX002: 'Amoxicillin (500mg IV)',
  PROP003: 'Propofol (10mg/mL IV)',
  HEP004: 'Heparin Sodium (5,000 IU)',
  SAL005: '0.9% Normal Saline (1L)',
  CEF006: 'Ceftriaxone (1g IV)',
  AZI007: 'Azithromycin (500mg)',
  MOR008: 'Morphine Sulfate (10mg)',
};

const HOSPITAL_NAMES = {
  H001: 'Metro Health Central (Trauma 1)',
  H002: "St. Luke's Memorial",
  H003: 'Mercy General Medical',
  H004: 'Cedars Regional Surgical',
  H005: 'Central Surplus Logistics Hub (H005)',
  H006: 'Valley Memorial Healthcare',
  H007: 'Northern Ridge Regional',
};

export default function Screen2ImpactAnalysis({
  inventory = [],
  disruptionLength = 12,
  selectedShortage,
  onSelectShortage,
  onProceedToRecovery,
  loading = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'disrupted', 'safe'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Filtering
  const filteredData = useMemo(() => {
    return inventory.filter((item) => {
      const isDisrupted = item.daysCover < disruptionLength;

      const matchesSearch =
        item.HOSPITAL_ID.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.MATERIAL_ID.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (MEDICINE_NAMES[item.MATERIAL_ID] || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (HOSPITAL_NAMES[item.HOSPITAL_ID] || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (filterMode === 'disrupted') return isDisrupted;
      if (filterMode === 'safe') return !isDisrupted;
      return true;
    });
  }, [inventory, disruptionLength, searchQuery, filterMode]);

  // Pagination Slicing
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEntries = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const disruptedCount = inventory.filter((item) => item.daysCover < disruptionLength).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Screen Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl glass-panel border border-[#e0e8e2]/15 bg-[#2c2e35]/60">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-950/80 text-red-300 text-xs font-mono font-semibold mb-2 border border-red-500/40">
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
            <span>DISRUPTION THRESHOLD: {disruptionLength} DAYS LEAD TIME</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#e0e8e2] tracking-tight">
            Screen 2: Impact Analysis (The Problem)
          </h2>
          <p className="text-xs text-[#e0e8e2]/70 mt-1 max-w-2xl leading-relaxed">
            Hospitals highlighted in <strong className="text-red-400">red</strong> have stock below the{' '}
            <strong className="text-[#f0cd6e] font-mono">{disruptionLength}-day</strong> disruption length and will
            experience stockout before external shipments arrive.
          </p>
        </div>

        {selectedShortage && (
          <button
            onClick={() => onProceedToRecovery(selectedShortage)}
            className="self-start md:self-center flex items-center space-x-2.5 px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-2xl shadow-orange-500/50 ring-2 ring-orange-300 hover:scale-105 active:scale-95 transition-all group"
          >
            <Sparkles className="w-4 h-4 text-slate-950 group-hover:rotate-45 transition-transform" />
            <span>Plan Recovery for {selectedShortage.HOSPITAL_ID} ({selectedShortage.MATERIAL_ID})</span>
            <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>

      {/* Main Table Container */}
      <div className="rounded-3xl glass-panel border border-[#e0e8e2]/15 overflow-hidden shadow-2xl">
        {/* Table Top Controls */}
        <div className="p-5 border-b border-[#e0e8e2]/15 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#2c2e35]/50">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#e0e8e2]/80">
              Disruption Vulnerability Matrix
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-red-950 text-red-300 border border-red-600/40 font-bold">
              {disruptedCount} Hospitals Facing Stockout (&lt; {disruptionLength}d)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex rounded-xl bg-[#2a3f3f]/80 p-1 border border-[#e0e8e2]/10 text-xs">
              <button
                onClick={() => {
                  setFilterMode('all');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  filterMode === 'all'
                    ? 'bg-[#467750] text-[#e0e8e2] font-bold shadow'
                    : 'text-[#e0e8e2]/70 hover:text-white'
                }`}
              >
                All Facilities
              </button>
              <button
                onClick={() => {
                  setFilterMode('disrupted');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  filterMode === 'disrupted'
                    ? 'bg-red-600 text-white font-bold shadow'
                    : 'text-red-400 hover:text-red-300'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                Disrupted (&lt;{disruptionLength}d)
              </button>
              <button
                onClick={() => {
                  setFilterMode('safe');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  filterMode === 'safe'
                    ? 'bg-[#89c07e] text-[#2c2e35] font-bold shadow'
                    : 'text-[#89c07e] hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#89c07e]"></span>
                Safe (&ge;{disruptionLength}d)
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#e0e8e2]/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search Hospital or Material..."
                className="w-48 sm:w-56 pl-9 pr-3 py-1.5 rounded-xl bg-[#2a3f3f]/70 border border-[#e0e8e2]/15 text-xs text-[#e0e8e2] placeholder-[#e0e8e2]/40 focus:outline-none focus:ring-1 focus:ring-[#f0cd6e]"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e0e8e2]/15 bg-[#2c2e35]/70 text-[11px] font-semibold text-[#e0e8e2]/70 uppercase tracking-wider">
                <th className="py-3.5 px-5">Hospital ID</th>
                <th className="py-3.5 px-5">Medicine ID</th>
                <th className="py-3.5 px-5 text-right">Stock Qty</th>
                <th className="py-3.5 px-5 text-right">Daily Use</th>
                <th className="py-3.5 px-4 text-center">Unit</th>
                <th className="py-3.5 px-5 text-left">Days of Cover</th>
                <th className="py-3.5 px-5 text-center">Disruption Deficit</th>
                <th className="py-3.5 px-5 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#e0e8e2]/10 text-sm">
              {currentEntries.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-[#e0e8e2]/60">
                    {loading ? 'Querying SAP RFC...' : 'No matching hospital inventory records.'}
                  </td>
                </tr>
              ) : (
                currentEntries.map((item, index) => {
                  const isDisrupted = item.daysCover < disruptionLength;
                  const deficitDays = disruptionLength - item.daysCover;
                  const isSelected =
                    selectedShortage &&
                    selectedShortage.HOSPITAL_ID === item.HOSPITAL_ID &&
                    selectedShortage.MATERIAL_ID === item.MATERIAL_ID;

                  return (
                    <tr
                      key={`${item.HOSPITAL_ID}-${item.MATERIAL_ID}-${index}`}
                      onClick={() => onSelectShortage(item)}
                      className={`cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? 'bg-red-950/60 border-l-4 border-l-[#f0cd6e] ring-1 ring-[#f0cd6e]/40 shadow-inner'
                          : isDisrupted
                          ? 'bg-red-950/40 hover:bg-red-950/50 border-l-4 border-l-red-500'
                          : 'bg-transparent hover:bg-[#2a3f3f]/40 border-l-4 border-l-transparent'
                      }`}
                    >
                      {/* Hospital ID */}
                      <td className="py-4 px-5">
                        <div className="flex items-center space-x-2.5">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded-lg border text-xs ${
                              isDisrupted
                                ? 'bg-red-900/60 text-red-200 border-red-700/60'
                                : 'bg-[#2a3f3f] text-[#e0e8e2] border-[#e0e8e2]/15'
                            }`}
                          >
                            {item.HOSPITAL_ID}
                          </span>
                          <span className="text-xs text-[#e0e8e2] font-medium">
                            {HOSPITAL_NAMES[item.HOSPITAL_ID] || item.HOSPITAL_ID}
                          </span>
                        </div>
                      </td>

                      {/* Medicine ID */}
                      <td className="py-4 px-5">
                        <div className="flex items-center space-x-2.5">
                          <span className="font-mono font-semibold text-[#89c07e] bg-[#2a3f3f]/80 px-2 py-0.5 rounded-lg border border-[#89c07e]/30 text-xs">
                            {item.MATERIAL_ID}
                          </span>
                          <span className="text-xs text-[#e0e8e2]">
                            {MEDICINE_NAMES[item.MATERIAL_ID] || item.MATERIAL_ID}
                          </span>
                        </div>
                      </td>

                      {/* Stock Qty */}
                      <td className="py-4 px-5 text-right font-mono font-bold text-[#e0e8e2]">
                        {item.STOCK_QTY.toLocaleString()}
                      </td>

                      {/* Daily Use */}
                      <td className="py-4 px-5 text-right font-mono text-[#e0e8e2]/80">
                        {item.DAILY_USE.toLocaleString()}{' '}
                        <span className="text-[10px] text-[#e0e8e2]/50 font-sans">/d</span>
                      </td>

                      {/* Unit */}
                      <td className="py-4 px-4 text-center">
                        <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-[#2a3f3f] text-[#e0e8e2] border border-[#e0e8e2]/10">
                          {item.UNIT}
                        </span>
                      </td>

                      {/* Days of Cover */}
                      <td className="py-4 px-5">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-mono font-bold text-sm ${
                              isDisrupted
                                ? 'text-red-400 font-extrabold animate-pulse'
                                : 'text-[#89c07e]'
                            }`}
                          >
                            {item.daysCover} Days
                          </span>
                          {isDisrupted && (
                            <span className="text-[10px] font-bold text-red-200 bg-red-900/80 px-2 py-0.5 rounded border border-red-500 font-mono">
                              &lt; {disruptionLength}d VULNERABLE
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Disruption Deficit */}
                      <td className="py-4 px-5 text-center">
                        {isDisrupted ? (
                          <span className="font-mono text-xs font-bold text-red-400 bg-red-950/80 px-2.5 py-1 rounded-lg border border-red-700/60 inline-flex items-center gap-1">
                            &minus;{deficitDays} Days Deficit
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-[#89c07e] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>+{item.daysCover - disruptionLength}d Buffer</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-5 text-center">
                        {isDisrupted ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectShortage(item);
                              onProceedToRecovery(item);
                            }}
                            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-slate-950 shadow-lg shadow-orange-500/40 ring-1 ring-orange-300 hover:brightness-115 hover:scale-105 active:scale-95 transition-all"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                            <span>Plan Recovery</span>
                            <ArrowRight className="w-3 h-3 text-slate-950" />
                          </button>
                        ) : (
                          <span className="text-xs text-[#89c07e] font-medium font-mono">
                            Optimal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#e0e8e2]/15 bg-[#2c2e35]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#e0e8e2]/80">
            Showing <strong className="text-[#f0cd6e] font-mono">{startIndex + 1}</strong> to{' '}
            <strong className="text-[#f0cd6e] font-mono">{Math.min(startIndex + itemsPerPage, totalItems)}</strong> of{' '}
            <strong className="text-[#e0e8e2] font-mono">{totalItems}</strong> entries
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2a3f3f]/80 text-[#e0e8e2] border border-[#e0e8e2]/15 disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-xl text-xs font-mono font-bold transition-all ${
                  page === currentPage
                    ? 'bg-[#f0cd6e] text-[#2c2e35]'
                    : 'bg-[#2a3f3f]/60 text-[#e0e8e2]/80 border border-[#e0e8e2]/10'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#467750] text-[#e0e8e2] border border-[#89c07e]/40 disabled:opacity-30"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
