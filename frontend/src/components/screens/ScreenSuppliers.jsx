import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Truck,
  ShieldCheck,
  ShieldAlert,
  Clock,
  DollarSign,
  Search,
  Filter,
  Sparkles,
  RefreshCw,
  Cpu,
  Building2,
  Package,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Send,
  Zap,
  Globe2,
  Warehouse,
  Flame,
  X,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function ScreenSuppliers({
  onSelectPlanForApproval,
  onNavigateToScreen,
}) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCompliance, setFilterCompliance] = useState('ALL'); // 'ALL', 'COMPLIANT', 'NON_COMPLIANT'
  const [sortBy, setSortBy] = useState('LEAD_TIME'); // 'LEAD_TIME', 'RATE_ASC', 'RATE_DESC', 'CAPACITY'

  // AI Disruption Modal / Runner State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [alertPrompt, setAlertPrompt] = useState('Port of Mumbai closed for 12 days');
  const [aiRunning, setAiRunning] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);
  const [activeStageTab, setActiveStageTab] = useState('stage3');

  /**
   * Fetch live suppliers data from /api/suppliers
   */
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/suppliers`);
      setSuppliers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  /**
   * Trigger the 4-Stage AI Disruption Analysis
   */
  const handleRunAiAnalysis = async (customAlert = null) => {
    const alertToSend = customAlert || alertPrompt;
    setAiRunning(true);
    setAiAnalysisResult(null);
    setIsAiModalOpen(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/analyze-disruption`, {
        alert: alertToSend,
      });
      setAiAnalysisResult(response.data);
    } catch (err) {
      console.error('Failed to run AI analysis:', err);
    } finally {
      setAiRunning(false);
    }
  };

  // Filtered and sorted supplier dataset
  const filteredSuppliers = useMemo(() => {
    let list = [...suppliers];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.SUPPLIER_NAME.toLowerCase().includes(query) ||
          s.SUPPLIER_ID.toLowerCase().includes(query) ||
          s.LOCATION.toLowerCase().includes(query) ||
          s.MATERIAL_ID.toLowerCase().includes(query)
      );
    }

    // Compliance filter
    if (filterCompliance === 'COMPLIANT') {
      list = list.filter((s) => s.COMPLIANCE === 'Y');
    } else if (filterCompliance === 'NON_COMPLIANT') {
      list = list.filter((s) => s.COMPLIANCE === 'N');
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'LEAD_TIME') return a.LEAD_TIME - b.LEAD_TIME;
      if (sortBy === 'RATE_ASC') return a.UNIT_COST - b.UNIT_COST;
      if (sortBy === 'RATE_DESC') return b.UNIT_COST - a.UNIT_COST;
      if (sortBy === 'CAPACITY') return b.CAPACITY - a.CAPACITY;
      return 0;
    });

    return list;
  }, [suppliers, searchQuery, filterCompliance, sortBy]);

  // Key KPI calculations
  const totalSuppliersCount = suppliers.length;
  const compliantCount = suppliers.filter((s) => s.COMPLIANCE === 'Y').length;
  const nonCompliantCount = suppliers.filter((s) => s.COMPLIANCE === 'N').length;
  const fastestLeadTime =
    suppliers.length > 0 ? Math.min(...suppliers.map((s) => s.LEAD_TIME)) : 1;
  const avgRate =
    suppliers.length > 0
      ? Math.round(
          suppliers.reduce((acc, curr) => acc + curr.UNIT_COST, 0) /
            suppliers.length
        )
      : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Screen Title & AI Action Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-[#e0e8e2]/15 bg-gradient-to-r from-[#2c2e35]/95 via-[#2a3f3f]/85 to-[#2c2e35]/95 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-[#467750]/30 border border-[#89c07e]/40 text-[#89c07e]">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    External Suppliers & Transfer Logistics
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f0cd6e]/20 text-[#f0cd6e] border border-[#f0cd6e]/40 font-bold">
                    SAP ET_SUPPLIERS
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#e0e8e2]/70 font-mono">
                  Master Vendor Ledger • Contracted Unit Rates & Transfer Durations
                </p>
              </div>
            </div>
          </div>

          {/* Trigger 4-Stage AI Disruption Analysis */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleRunAiAnalysis()}
              className="flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#f0cd6e] via-[#89c07e] to-[#467750] text-[#2c2e35] shadow-lg shadow-[#f0cd6e]/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 text-[#2c2e35]" />
              <span>Run 4-Stage GenAI Analysis</span>
            </button>

            <button
              onClick={fetchSuppliers}
              disabled={loading}
              className="p-3 rounded-2xl bg-[#2a3f3f]/60 border border-[#e0e8e2]/15 hover:border-[#89c07e]/40 text-[#e0e8e2] transition-all"
              title="Refresh Supplier Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#89c07e]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Vendors */}
        <div className="glass-panel p-5 rounded-3xl border border-[#e0e8e2]/10 bg-[#2c2e35]/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#e0e8e2]/60 font-mono uppercase tracking-wider">
            <span>Monitored Vendors</span>
            <Building2 className="w-4 h-4 text-[#89c07e]" />
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {totalSuppliersCount}
          </div>
          <div className="text-[11px] text-[#89c07e] flex items-center space-x-1 font-mono">
            <span>Global distribution hubs connected</span>
          </div>
        </div>

        {/* Fastest Transfer Lead Time */}
        <div className="glass-panel p-5 rounded-3xl border border-[#e0e8e2]/10 bg-[#2c2e35]/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#e0e8e2]/60 font-mono uppercase tracking-wider">
            <span>Fastest Transfer Velocity</span>
            <Clock className="w-4 h-4 text-[#f0cd6e]" />
          </div>
          <div className="text-3xl font-black text-[#f0cd6e] font-mono">
            {fastestLeadTime} Day <span className="text-sm font-normal text-[#e0e8e2]/60">({fastestLeadTime * 24}h)</span>
          </div>
          <div className="text-[11px] text-[#89c07e] flex items-center space-x-1 font-mono">
            <span>Nordic Fluid Systems (Express Road)</span>
          </div>
        </div>

        {/* Cold-Chain Compliance */}
        <div className="glass-panel p-5 rounded-3xl border border-[#e0e8e2]/10 bg-[#2c2e35]/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#e0e8e2]/60 font-mono uppercase tracking-wider">
            <span>Cold-Chain Audit</span>
            <ShieldCheck className="w-4 h-4 text-[#89c07e]" />
          </div>
          <div className="text-3xl font-black text-white font-mono flex items-baseline space-x-2">
            <span>{compliantCount}</span>
            <span className="text-xs text-[#89c07e] font-sans font-bold">Passed</span>
            <span className="text-sm text-[#e0e8e2]/30">/</span>
            <span className="text-xs text-[#f0cd6e] font-sans font-bold">{nonCompliantCount} Flagged</span>
          </div>
          <div className="text-[11px] text-[#f0cd6e] flex items-center space-x-1 font-mono">
            <span>V1003 non-compliant (rejected by AI)</span>
          </div>
        </div>

        {/* Average Unit Rate */}
        <div className="glass-panel p-5 rounded-3xl border border-[#e0e8e2]/10 bg-[#2c2e35]/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#e0e8e2]/60 font-mono uppercase tracking-wider">
            <span>Median Transfer Rate</span>
            <DollarSign className="w-4 h-4 text-[#89c07e]" />
          </div>
          <div className="text-3xl font-black text-[#89c07e] font-mono">
            ₹{avgRate} <span className="text-xs font-normal text-[#e0e8e2]/60">/ Unit</span>
          </div>
          <div className="text-[11px] text-[#e0e8e2]/60 flex items-center space-x-1 font-mono">
            <span>Range: ₹25 (Saline) - ₹210 (Propofol)</span>
          </div>
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="glass-panel p-4 rounded-3xl border border-[#e0e8e2]/10 bg-[#2c2e35]/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#e0e8e2]/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendor name, code, material, or hub location..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#2a3f3f]/50 border border-[#e0e8e2]/15 text-xs text-white placeholder-[#e0e8e2]/40 focus:outline-none focus:border-[#89c07e]/60 focus:ring-1 focus:ring-[#89c07e]/50 transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase font-bold text-[#e0e8e2]/50 tracking-wider mr-1">
            Status:
          </span>
          <button
            onClick={() => setFilterCompliance('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
              filterCompliance === 'ALL'
                ? 'bg-[#89c07e] text-[#2c2e35] shadow-md'
                : 'bg-[#2a3f3f]/50 text-[#e0e8e2]/70 hover:text-white'
            }`}
          >
            All Vendors ({suppliers.length})
          </button>
          <button
            onClick={() => setFilterCompliance('COMPLIANT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              filterCompliance === 'COMPLIANT'
                ? 'bg-[#467750] text-[#e0e8e2] border border-[#89c07e]/50'
                : 'bg-[#2a3f3f]/50 text-[#89c07e] hover:bg-[#2a3f3f]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#89c07e]" />
            <span>Compliant (Y)</span>
          </button>
          <button
            onClick={() => setFilterCompliance('NON_COMPLIANT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              filterCompliance === 'NON_COMPLIANT'
                ? 'bg-[#f0cd6e] text-[#2c2e35] font-bold'
                : 'bg-[#2a3f3f]/50 text-[#f0cd6e] hover:bg-[#2a3f3f]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#f0cd6e]" />
            <span>Compromised (N)</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-1.5 ml-2 border-l border-[#e0e8e2]/15 pl-3">
            <span className="text-[11px] uppercase font-bold text-[#e0e8e2]/50 tracking-wider">
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#2a3f3f]/70 border border-[#e0e8e2]/15 text-xs text-[#e0e8e2] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#89c07e]/50"
            >
              <option value="LEAD_TIME">Fastest Transfer Time</option>
              <option value="RATE_ASC">Rate: Low to High</option>
              <option value="RATE_DESC">Rate: High to Low</option>
              <option value="CAPACITY">Largest Reserve Capacity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Suppliers Table & Rich Cards */}
      <div className="glass-panel rounded-3xl border border-[#e0e8e2]/15 overflow-hidden bg-[#2c2e35]/85 shadow-2xl">
        <div className="p-5 border-b border-[#e0e8e2]/10 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Warehouse className="w-5 h-5 text-[#89c07e]" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Supplier Fleet, Unit Rates & Transfer Durations
            </h3>
          </div>
          <div className="text-xs font-mono text-[#e0e8e2]/60">
            Showing <span className="text-[#89c07e] font-bold">{filteredSuppliers.length}</span> of {suppliers.length} vendors
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#e0e8e2]/10 bg-[#2a3f3f]/60 text-[11px] uppercase font-bold text-[#e0e8e2]/70 font-mono tracking-wider">
                <th className="py-4 px-6">Supplier Details</th>
                <th className="py-4 px-6">Material Specialization</th>
                <th className="py-4 px-6 text-right">Contracted Rate (₹/Unit)</th>
                <th className="py-4 px-6 text-center">Unit Time of Duration to Transfer</th>
                <th className="py-4 px-6 text-right">Emergency Reserve</th>
                <th className="py-4 px-6 text-center">SLA Reliability</th>
                <th className="py-4 px-6 text-center">Cold-Chain Compliance</th>
                <th className="py-4 px-6 text-center">Agent Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e8e2]/10 font-mono">
              {filteredSuppliers.map((supplier) => {
                const isCompliant = supplier.COMPLIANCE === 'Y';
                const leadTimeHours = supplier.LEAD_TIME * 24;

                return (
                  <tr
                    key={supplier.SUPPLIER_ID}
                    className={`hover:bg-[#2a3f3f]/40 transition-colors ${
                      !isCompliant ? 'bg-[#f0cd6e]/5' : ''
                    }`}
                  >
                    {/* Supplier Identity */}
                    <td className="py-4 px-6">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm tracking-tight font-sans">
                            {supplier.SUPPLIER_NAME}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2a3f3f] text-[#89c07e] border border-[#89c07e]/30">
                            {supplier.SUPPLIER_ID}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-[11px] text-[#e0e8e2]/60">
                          <Globe2 className="w-3.5 h-3.5 text-[#89c07e]/70" />
                          <span>{supplier.LOCATION}</span>
                        </div>
                      </div>
                    </td>

                    {/* Material Handled */}
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-[#f0cd6e]" />
                        <div>
                          <span className="font-bold text-[#e0e8e2]">
                            {supplier.MATERIAL_ID}
                          </span>
                          <div className="text-[10px] text-[#e0e8e2]/50">
                            Critical Tier Stock
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contracted Rate */}
                    <td className="py-4 px-6 text-right">
                      <div className="space-y-0.5">
                        <div className="text-base font-black text-[#89c07e]">
                          ₹{supplier.UNIT_COST.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-[#e0e8e2]/50 uppercase">
                          Per Unit (SAP Fixed)
                        </div>
                      </div>
                    </td>

                    {/* Transfer Duration */}
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex flex-col items-center p-2 rounded-2xl bg-[#2a3f3f]/60 border border-[#e0e8e2]/15">
                        <div className="flex items-center space-x-1.5 text-sm font-black text-[#f0cd6e]">
                          <Clock className="w-4 h-4 text-[#f0cd6e]" />
                          <span>{supplier.LEAD_TIME} {supplier.LEAD_TIME === 1 ? 'Day' : 'Days'}</span>
                        </div>
                        <div className="text-[10px] text-[#e0e8e2]/70 font-semibold">
                          ({leadTimeHours} Hours Velocity)
                        </div>
                      </div>
                    </td>

                    {/* Available Capacity */}
                    <td className="py-4 px-6 text-right">
                      <div className="space-y-0.5">
                        <div className="text-sm font-bold text-white">
                          {supplier.CAPACITY.toLocaleString()} EA
                        </div>
                        <div className="w-24 h-1.5 bg-[#2a3f3f] rounded-full overflow-hidden ml-auto">
                          <div
                            className="h-full bg-gradient-to-r from-[#467750] to-[#89c07e] rounded-full"
                            style={{
                              width: `${Math.min(100, (supplier.CAPACITY / 12000) * 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Reliability */}
                    <td className="py-4 px-6 text-center">
                      <span className="text-xs font-bold text-[#89c07e] px-2.5 py-1 rounded-xl bg-[#467750]/20 border border-[#89c07e]/30">
                        {supplier.RELIABILITY}
                      </span>
                    </td>

                    {/* Compliance */}
                    <td className="py-4 px-6 text-center">
                      {isCompliant ? (
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-[#467750]/30 border border-[#89c07e]/40 text-[#89c07e] text-[11px] font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Cold-Chain Verified (Y)</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-[#f0cd6e]/20 border border-[#f0cd6e]/50 text-[#f0cd6e] text-[11px] font-bold animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Flagged: Non-Compliant (N)</span>
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() =>
                          handleRunAiAnalysis(
                            `Disruption alert for supplier ${supplier.SUPPLIER_NAME} (${supplier.LOCATION}): Port corridor delayed by ${supplier.LEAD_TIME + 10} days.`
                          )
                        }
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2a3f3f] hover:bg-[#467750] border border-[#e0e8e2]/20 hover:border-[#89c07e]/50 text-[#e0e8e2] hover:text-white transition-all flex items-center space-x-1 mx-auto"
                      >
                        <Sparkles className="w-3 h-3 text-[#f0cd6e]" />
                        <span>Simulate</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4-Stage GenAI Disruption Analysis Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-[#2c2e35] border border-[#e0e8e2]/20 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-[#e0e8e2]/10 bg-gradient-to-r from-[#2c2e35] via-[#2a3f3f] to-[#2c2e35] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#467750]/30 border border-[#89c07e]/50 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-[#f0cd6e] animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <span>4-Stage GenAI Disruption & Compliance Engine</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#89c07e]/20 text-[#89c07e] border border-[#89c07e]/40">
                      gemini-2.5-flash
                    </span>
                  </h3>
                  <p className="text-xs text-[#e0e8e2]/60 font-mono">
                    POST /api/analyze-disruption • Orchestrated AI Agent Chain
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAiModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-[#2a3f3f] hover:bg-[#2c2e35] text-[#e0e8e2]/60 hover:text-white flex items-center justify-center border border-[#e0e8e2]/15 text-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input Simulation Prompt */}
            <div className="p-6 border-b border-[#e0e8e2]/10 bg-[#2a3f3f]/40 space-y-3">
              <label className="text-xs uppercase font-bold text-[#f0cd6e] tracking-wider flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-[#f0cd6e] animate-pulse" />
                <span>Simulated Disruption Alert Payload</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={alertPrompt}
                  onChange={(e) => setAlertPrompt(e.target.value)}
                  placeholder="e.g., Port of Mumbai closed for 12 days..."
                  className="flex-1 px-4 py-2 rounded-2xl bg-[#2c2e35] border border-[#e0e8e2]/20 text-xs text-white focus:outline-none focus:border-[#89c07e]"
                />
                <button
                  onClick={() => handleRunAiAnalysis()}
                  disabled={aiRunning}
                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#467750] to-[#89c07e] text-[#2c2e35] font-bold text-xs flex items-center space-x-1.5 hover:brightness-110 disabled:opacity-50"
                >
                  {aiRunning ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#2c2e35]" />
                  ) : (
                    <Send className="w-4 h-4 text-[#2c2e35]" />
                  )}
                  <span>Re-Analyze</span>
                </button>
              </div>
            </div>

            {/* Stage Selector Tabs */}
            {aiAnalysisResult && (
              <div className="flex border-b border-[#e0e8e2]/10 bg-[#2c2e35] px-6 pt-3 gap-2 overflow-x-auto">
                <button
                  onClick={() => setActiveStageTab('stage1')}
                  className={`pb-3 px-3 text-xs font-mono font-bold border-b-2 transition-all ${
                    activeStageTab === 'stage1'
                      ? 'border-[#89c07e] text-[#89c07e]'
                      : 'border-transparent text-[#e0e8e2]/60 hover:text-white'
                  }`}
                >
                  Stage 1: Sensing ({aiAnalysisResult.stages.step1_sensing.inventoryCount} items)
                </button>
                <button
                  onClick={() => setActiveStageTab('stage2')}
                  className={`pb-3 px-3 text-xs font-mono font-bold border-b-2 transition-all ${
                    activeStageTab === 'stage2'
                      ? 'border-[#f0cd6e] text-[#f0cd6e]'
                      : 'border-transparent text-[#e0e8e2]/60 hover:text-white'
                  }`}
                >
                  Stage 2: Impact ({aiAnalysisResult.stages.step2_impact.totalCriticalShortages} Shortages)
                </button>
                <button
                  onClick={() => setActiveStageTab('stage3')}
                  className={`pb-3 px-3 text-xs font-mono font-bold border-b-2 transition-all ${
                    activeStageTab === 'stage3'
                      ? 'border-[#89c07e] text-[#89c07e]'
                      : 'border-transparent text-[#e0e8e2]/60 hover:text-white'
                  }`}
                >
                  Stage 3: Recovery & Strict Compliance
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {aiRunning && (
                <div className="text-center py-12 space-y-4">
                  <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#f0cd6e] animate-spin"></div>
                    <Cpu className="w-8 h-8 text-[#89c07e] animate-pulse" />
                  </div>
                  <div className="text-sm font-bold text-white">
                    Executing 4-Stage Agentic Reasoning Chain...
                  </div>
                  <div className="text-xs text-[#e0e8e2]/60 font-mono">
                    Step 1 (Sensing) &rarr; Step 2 (Impact Evaluation) &rarr; Step 3 (Compliance Filter & Recovery)
                  </div>
                </div>
              )}

              {!aiRunning && aiAnalysisResult && (
                <div className="space-y-6">
                  {/* Stage 1 Content */}
                  {activeStageTab === 'stage1' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-[#2a3f3f]/50 border border-[#89c07e]/30">
                        <div className="text-xs font-bold text-[#89c07e] uppercase mb-1">
                          Step 1: Sensing Complete
                        </div>
                        <p className="text-xs text-[#e0e8e2]/80">
                          Retrieved live SAP ERP stock telemetry across all regional hubs and vendor master tables.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                        <div className="p-4 rounded-2xl bg-[#2a3f3f]/30 border border-[#e0e8e2]/10 space-y-1">
                          <span className="text-[#e0e8e2]/60">Total SAP Stock Records:</span>
                          <div className="text-xl font-bold text-white">
                            {aiAnalysisResult.stages.step1_sensing.inventoryCount} items
                          </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#2a3f3f]/30 border border-[#e0e8e2]/10 space-y-1">
                          <span className="text-[#e0e8e2]/60">Suppliers Audited:</span>
                          <div className="text-xl font-bold text-white">
                            {aiAnalysisResult.stages.step1_sensing.suppliersCount} vendors
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stage 2 Content */}
                  {activeStageTab === 'stage2' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-[#f0cd6e]/10 border border-[#f0cd6e]/30 text-xs">
                        <div className="font-bold text-[#f0cd6e] mb-1">
                          Disruption Impact Assessment
                        </div>
                        <p className="text-[#e0e8e2]/80">
                          {aiAnalysisResult.stages.step2_impact.disruptionSummary}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-bold uppercase text-[#e0e8e2]/60">
                          Critical Shortages Detected (Days Cover &lt; {aiAnalysisResult.stages.step2_impact.disruptionDurationDays}d):
                        </div>
                        <div className="space-y-2">
                          {aiAnalysisResult.stages.step2_impact.criticalShortages.map((shortage, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-2xl bg-[#2a3f3f]/40 border border-[#f0cd6e]/20 flex items-center justify-between text-xs font-mono"
                            >
                              <div className="flex items-center space-x-3">
                                <span className="font-bold text-white">
                                  {shortage.hospitalId} ({shortage.materialId})
                                </span>
                                <span className="text-[#f0cd6e]">
                                  {shortage.daysCover}d Cover remaining
                                </span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-[#89c07e]">
                                  Shortfall: {shortage.shortfallQty} units
                                </span>
                                <span className="px-2 py-0.5 rounded bg-[#f0cd6e]/20 text-[#f0cd6e] font-bold text-[10px]">
                                  {shortage.riskLevel}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stage 3 Content */}
                  {activeStageTab === 'stage3' && (
                    <div className="space-y-6">
                      {/* Cold-Chain Compliance Audit Table */}
                      <div className="p-4 rounded-2xl bg-[#2a3f3f]/30 border border-[#e0e8e2]/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                            <ShieldCheck className="w-4 h-4 text-[#89c07e]" />
                            <span>Supplier Compliance Audit Results</span>
                          </span>
                          <span className="text-[11px] font-mono text-[#89c07e]">
                            Verdict: {aiAnalysisResult.stages.step3_recovery_and_compliance.complianceSummary?.verdict}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {aiAnalysisResult.stages.step3_recovery_and_compliance.evaluatedSuppliers.map(
                            (s) => (
                              <div
                                key={s.supplierId}
                                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
                                  s.status === 'APPROVED'
                                    ? 'bg-[#467750]/20 border-[#89c07e]/30'
                                    : 'bg-[#f0cd6e]/15 border-[#f0cd6e]/40'
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="font-bold text-white flex items-center space-x-2">
                                    <span>{s.supplierName}</span>
                                    <span className="text-[10px] text-[#e0e8e2]/60">
                                      ({s.supplierId})
                                    </span>
                                  </div>
                                  {s.rejectionReason && (
                                    <div className="text-[10px] text-[#f0cd6e] font-sans">
                                      {s.rejectionReason}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center space-x-3">
                                  <span className="text-[#e0e8e2]/70">
                                    Lead Time: {s.leadTimeDays}d (${s.unitCost}/unit)
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                      s.status === 'APPROVED'
                                        ? 'bg-[#89c07e] text-[#2c2e35]'
                                        : 'bg-[#f0cd6e] text-[#2c2e35]'
                                    }`}
                                  >
                                    {s.status}
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* Scenario Comparison & Recommendation */}
                      {aiAnalysisResult.executionReadyPlan && (
                        <div className="p-5 rounded-3xl bg-gradient-to-tr from-[#2a3f3f] to-[#2c2e35] border border-[#89c07e]/40 shadow-xl space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Sparkles className="w-5 h-5 text-[#f0cd6e]" />
                              <h4 className="text-sm font-bold text-white">
                                Recommended Autonomous Recovery Plan
                              </h4>
                            </div>
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#89c07e] text-[#2c2e35] font-black">
                              VERIFIED (PASSED)
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Option A */}
                            <div className="p-4 rounded-2xl bg-[#467750]/30 border border-[#89c07e]/50 space-y-2">
                              <div className="text-xs font-bold text-[#89c07e] flex items-center justify-between">
                                <span>Option A: Internal Transfer</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#89c07e]/20 text-[#89c07e]">
                                  Selected
                                </span>
                              </div>
                              <div className="text-sm font-bold text-white">
                                {aiAnalysisResult.executionReadyPlan.optionA.title}
                              </div>
                              <div className="text-xs text-[#e0e8e2]/70 font-mono space-y-1">
                                <div>Lead Time: {aiAnalysisResult.executionReadyPlan.optionA.leadTimeDays} Days (Instant Dispatch)</div>
                                <div>Est. Cost: ₹{aiAnalysisResult.executionReadyPlan.optionA.totalCost?.toLocaleString()}</div>
                              </div>
                            </div>

                            {/* Option B */}
                            <div className="p-4 rounded-2xl bg-[#2a3f3f]/50 border border-[#e0e8e2]/15 space-y-2">
                              <div className="text-xs font-bold text-[#e0e8e2]/70 flex items-center justify-between">
                                <span>Option B: Commercial Purchase</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2a3f3f] text-[#e0e8e2]/60">
                                  Alternative
                                </span>
                              </div>
                              <div className="text-sm font-bold text-white">
                                {aiAnalysisResult.executionReadyPlan.optionB.title}
                              </div>
                              <div className="text-xs text-[#e0e8e2]/70 font-mono space-y-1">
                                <div>Lead Time: {aiAnalysisResult.executionReadyPlan.optionB.leadTimeDays} Days</div>
                                <div>Est. Cost: ₹{aiAnalysisResult.executionReadyPlan.optionB.totalCost?.toLocaleString()}</div>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-[#2c2e35] border border-[#e0e8e2]/10 text-xs text-[#e0e8e2]/80">
                            <span className="font-bold text-[#f0cd6e]">Agent Rationale: </span>
                            {aiAnalysisResult.executionReadyPlan.reasoning}
                          </div>

                          {/* Action Button to Human Approval Screen */}
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={() => {
                                if (onSelectPlanForApproval) {
                                  onSelectPlanForApproval({
                                    id: 'PLAN-AI-AUTO',
                                    type: 'Option A (Internal Transfer)',
                                    fromHospital: 'H005',
                                    toHospital: aiAnalysisResult.executionReadyPlan.hospitalId,
                                    materialId: aiAnalysisResult.executionReadyPlan.materialId,
                                    qty: aiAnalysisResult.executionReadyPlan.requiredQty,
                                    leadTime: '0 Days (Immediate)',
                                    cost: '₹15 / unit (Internal logistics only)',
                                    rationale: aiAnalysisResult.executionReadyPlan.reasoning,
                                  });
                                }
                                setIsAiModalOpen(false);
                                if (onNavigateToScreen) {
                                  onNavigateToScreen(5); // Navigate to Screen 5: Human Approval
                                }
                              }}
                              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#f0cd6e] to-[#89c07e] text-[#2c2e35] font-black text-xs flex items-center space-x-2 hover:brightness-110 shadow-lg shadow-[#f0cd6e]/30"
                            >
                              <span>Send Plan to Human Approval (Screen 5)</span>
                              <ArrowRight className="w-4 h-4 text-[#2c2e35]" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
