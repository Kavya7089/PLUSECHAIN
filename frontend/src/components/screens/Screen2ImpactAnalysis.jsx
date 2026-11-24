import React, { useState, useMemo } from 'react';
import { usePulseChain } from '../../context/PulseChainContext';
import ExternalRiskPanel from '../ExternalRiskPanel';
import CopyButton from '../common/CopyButton';
import {
  AlertOctagon,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Sparkles,
  MapPin,
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
  H004: 'Bhopal Apex Care Hospital',
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
  const { user } = usePulseChain();

  const isRegional =
    ['REGIONAL_ADMIN', 'REGIONAL_HEAD'].includes(user?.role) ||
    user?.canonicalRole === 'REGIONAL_HEAD' ||
    user?.canonicalRole === 'REGIONAL_ADMIN';

  const currentHospitalId = user?.hospitalId || user?.hospital_id || (isRegional ? 'ALL' : 'H004');
  const currentHospitalName = isRegional
    ? 'Madhya Pradesh Regional Corridor'
    : (HOSPITAL_NAMES[currentHospitalId] || 'Bhopal Apex Care Hospital');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'disrupted', 'safe'
  const [selectedHospitalFilter, setSelectedHospitalFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Filtering
  const filteredData = useMemo(() => {
    return inventory.filter((item) => {
      const isDisrupted = item.daysCover < disruptionLength;

      if (selectedHospitalFilter !== 'ALL' && item.HOSPITAL_ID !== selectedHospitalFilter) {
        return false;
      }

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
  }, [inventory, disruptionLength, searchQuery, filterMode, selectedHospitalFilter]);

  // Pagination Slicing
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEntries = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const disruptedCount = inventory.filter((item) => item.daysCover < disruptionLength).length;

  return (
    <div className="space-y-5 text-abyss-text font-sans">
      {/* Scoping Banner */}
      <div className="p-4 rounded-xl bg-abyss-card border border-sand-border flex flex-wrap items-center justify-between text-xs font-mono shadow-sm gap-2">
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-volt" />
          <span className="font-bold text-abyss-text">
            Managing: {currentHospitalId === 'ALL' ? 'Regional Corridor' : currentHospitalId} — {currentHospitalName}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-abyss-elevated text-volt border border-sand-border font-bold">
            {isRegional ? 'REGIONAL OVERSIGHT' : 'STRICT ERP SCOPE'}
          </span>
        </div>
        <div className="text-[11px] text-abyss-muted">
          Corridor: <strong className="text-abyss-text">{user?.city || 'BHOPAL'}</strong> • Authority: <strong className="text-volt">{user?.name || user?.full_name || 'Dr. Kavya Rajoria'}</strong>
        </div>
      </div>

      {/* Screen Header */}
      <div className="p-5 rounded-xl bg-abyss-card border border-sand-border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-abyss-elevated text-volt text-xs font-mono font-bold border border-sand-border mb-2">
            <AlertOctagon className="w-3.5 h-3.5 text-volt" />
            <span>DISRUPTION THRESHOLD: {disruptionLength} DAYS LEAD TIME</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-abyss-text tracking-tight">
            Screen 2: Impact Analysis (Disruption Vulnerability)
          </h2>
          <p className="text-xs text-abyss-muted mt-1 max-w-2xl font-mono leading-relaxed">
            Materials highlighted in <strong className="text-volt">Taxi Volt</strong> have stock below the{' '}
            <strong className="text-volt font-mono">{disruptionLength}-day</strong> disruption horizon and will
            experience stockout before external shipments arrive.
          </p>
        </div>

        {selectedShortage && (
          <button
            type="button"
            onClick={() => onProceedToRecovery(selectedShortage)}
            className="self-start md:self-center flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-volt text-volt-text hover:bg-volt-hover active:scale-95 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-[#FFD400]"
          >
            <span>Plan Recovery for {selectedShortage.HOSPITAL_ID} ({selectedShortage.MATERIAL_ID})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Table Container Bento Card */}
      <div className="rounded-xl bg-abyss-card border border-sand-border overflow-hidden shadow-sm">
        {/* Table Top Controls */}
        <div className="p-4 border-b border-sand-border flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-abyss-elevated">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-abyss-muted font-mono">
              Vulnerability Matrix
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-abyss-card text-volt border border-sand-border font-bold">
              {disruptedCount} Facilities Facing Stockout (&lt; {disruptionLength}d)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Hospital Filter for Regional Admins */}
            {isRegional && (
              <select
                value={selectedHospitalFilter}
                onChange={(e) => {
                  setSelectedHospitalFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 rounded-lg bg-abyss-card border border-sand-border text-xs font-mono text-abyss-text focus:outline-none focus:ring-1 focus:ring-volt"
              >
                <option value="ALL">All Regional Hospitals</option>
                <option value="H001">H001 - Metro Health</option>
                <option value="H002">H002 - St. Luke's</option>
                <option value="H003">H003 - Mercy General</option>
                <option value="H004">H004 - Bhopal Apex</option>
                <option value="H005">H005 - Central Surplus</option>
                <option value="H006">H006 - Valley Memorial</option>
              </select>
            )}

            {/* Filter Tabs */}
            <div className="flex rounded-lg bg-abyss-card p-1 border border-sand-border text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  setFilterMode('all');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterMode === 'all'
                    ? 'bg-volt text-volt-text font-bold'
                    : 'text-abyss-muted hover:text-abyss-text'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterMode('disrupted');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterMode === 'disrupted'
                    ? 'bg-volt text-volt-text font-bold'
                    : 'text-abyss-muted hover:text-abyss-text'
                }`}
              >
                Disrupted (&lt;{disruptionLength}d)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterMode('safe');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterMode === 'safe'
                    ? 'bg-volt text-volt-text font-bold'
                    : 'text-abyss-muted hover:text-abyss-text'
                }`}
              >
                Safe (&ge;{disruptionLength}d)
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-abyss-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search Material or Hospital..."
                className="w-44 sm:w-52 pl-8 pr-3 py-1 rounded-lg bg-abyss-card border border-sand-border text-xs font-mono text-abyss-text placeholder-abyss-muted focus:outline-none focus:ring-1 focus:ring-volt"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-sand-border bg-abyss-elevated text-[11px] text-abyss-muted uppercase tracking-wider">
                <th className="py-3 px-4">Hospital ID</th>
                <th className="py-3 px-4">Medicine / Material</th>
                <th className="py-3 px-4 text-right">Current Stock</th>
                <th className="py-3 px-4 text-right">Daily Use</th>
                <th className="py-3 px-3 text-center">Unit</th>
                <th className="py-3 px-4 text-left">Days Cover</th>
                <th className="py-3 px-4 text-center">Deficit</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-sand-border">
              {currentEntries.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-abyss-muted">
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
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-volt/15 font-bold'
                          : isDisrupted
                          ? 'bg-abyss-elevated/60 hover:bg-abyss-elevated'
                          : 'hover:bg-abyss-elevated/40'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-abyss-text">{item.HOSPITAL_ID}</span>
                          <span className="text-[10px] text-abyss-muted hidden sm:inline">
                            ({item.CITY || 'BHOPAL'})
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-abyss-text">{item.MATERIAL_ID}</span>
                          <span className="text-[10px] text-abyss-muted font-sans hidden md:inline truncate max-w-[140px]">
                            {MEDICINE_NAMES[item.MATERIAL_ID] || ''}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-abyss-text">
                        {(item.CURRENT_STOCK || item.STOCK_QTY || 0).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right text-abyss-muted">
                        {item.DAILY_USE || 0}
                      </td>

                      <td className="py-3 px-3 text-center text-abyss-muted">
                        {item.UNIT || 'EA'}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold ${isDisrupted ? 'text-volt' : 'text-abyss-text'}`}>
                            {item.daysCover}d
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-abyss-elevated overflow-hidden border border-sand-border">
                            <div
                              className={`h-full ${isDisrupted ? 'bg-volt' : 'bg-sand-border'}`}
                              style={{ width: `${Math.min(100, (item.daysCover / disruptionLength) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isDisrupted ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-volt text-volt-text">
                            -{deficitDays}d Deficit
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-abyss-elevated text-abyss-muted border border-sand-border">
                            Covered
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectShortage(item);
                            onProceedToRecovery(item);
                          }}
                          className="px-2.5 py-1 rounded bg-abyss-elevated hover:bg-volt hover:text-volt-text text-abyss-text border border-sand-border transition-colors text-[11px] font-bold"
                        >
                          Plan
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-abyss-elevated border-t border-sand-border flex items-center justify-between text-xs font-mono">
          <span className="text-abyss-muted text-[11px]">
            Showing {filteredData.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} items
          </span>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded bg-abyss-card border border-sand-border text-abyss-text disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-abyss-text font-bold">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded bg-abyss-card border border-sand-border text-abyss-text disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Real-time External Risk Radar */}
      <ExternalRiskPanel
        hospitalId={selectedShortage?.HOSPITAL_ID || (isRegional ? 'H004' : currentHospitalId)}
        city={selectedShortage?.CITY || user?.city || 'BHOPAL'}
      />
    </div>
  );
}
