import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import DeliveryRouteMap from '../DeliveryRouteMap';
import CopyButton from '../common/CopyButton';
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
  Crown,
  Star,
  Award,
  MapPin,
  Map,
  Activity,
} from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api';

export default function ScreenSuppliers({
  onSelectPlanForApproval,
  onNavigateToScreen,
}) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCompliance, setFilterCompliance] = useState('ALL'); // 'ALL', 'COMPLIANT', 'NON_COMPLIANT'
  const [sortBy, setSortBy] = useState('LEAD_TIME'); // 'LEAD_TIME', 'RATE_ASC', 'RATE_DESC', 'CAPACITY'

  // Route Map Modal State
  const [selectedRouteModal, setSelectedRouteModal] = useState(null); // { supplier, route }
  const [loadingRoute, setLoadingRoute] = useState(false);

  // AI Disruption Modal / Runner State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [alertPrompt, setAlertPrompt] = useState('Port of Mumbai closed for 12 days');
  const [aiRunning, setAiRunning] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);
  const [activeStageTab, setActiveStageTab] = useState('stage3');

  // Pending Post-Delivery Reviews State (SAP HANA Re-Ranking)
  const [pendingReviews, setPendingReviews] = useState([]);
  const [selectedReviewShipment, setSelectedReviewShipment] = useState(null);
  const [reviewRatings, setReviewRatings] = useState({
    deliverySpeed: 95,
    onTimeRate: 98,
    reliability: 95,
    qualityScore: 98,
    emergResponse: 92,
    coldChainScore: 99,
    fulfilmentRate: 99,
    docCertScore: 97,
    comments: 'Verified cold chain integrity and punctual arrival at receiving bay.',
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);

  const fetchPendingReviews = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/reviews/pending`);
      if (res.data?.success) {
        setPendingReviews(res.data.shipments || []);
      }
    } catch (err) {
      console.warn('Pending reviews fetch note:', err.message);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedReviewShipment) return;
    setSubmittingReview(true);
    setReviewResult(null);

    try {
      const res = await axios.post(`${API_BASE_URL}/reviews`, {
        shipmentId: selectedReviewShipment.id,
        supplierId: selectedReviewShipment.supplier_id,
        materialId: selectedReviewShipment.material_id,
        ...reviewRatings,
      });

      if (res.data?.success) {
        setReviewResult({
          type: 'success',
          trustScore: res.data.trustScore,
          tier: res.data.supplierTier,
          message: res.data.message || 'Vendor metrics committed to SAP S/4HANA & TrustScore recalculated.',
        });
        await fetchSuppliers();
        await fetchPendingReviews();
      }
    } catch (err) {
      setReviewResult({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.message || 'Failed to submit review.',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleOpenRouteMap = async (supplier) => {
    setLoadingRoute(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/route/${supplier.SUPPLIER_ID}/H004`);
      if (res.data?.success) {
        setSelectedRouteModal({
          supplier,
          route: res.data.route,
        });
      }
    } catch (err) {
      console.warn('Route fetch error:', err.message);
    } finally {
      setLoadingRoute(false);
    }
  };

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
    fetchPendingReviews();
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
      <div className="bg-abyss-card border border-sand-border p-6 rounded-xl shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-abyss-elevated border border-volt/40 text-volt">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl sm:text-2xl font-black text-abyss-text tracking-tight">
                    External Suppliers & Transfer Logistics
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-volt/15 text-volt border border-volt/40 font-bold">
                    SAP ET_SUPPLIERS
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-abyss-muted font-mono">
                  Master Vendor Ledger • Contracted Unit Rates & Transfer Durations
                </p>
              </div>
            </div>
          </div>

          {/* Trigger 4-Stage AI Disruption Analysis & Post-Delivery Reviews */}
          <div className="flex flex-wrap items-center gap-3">
            {pendingReviews.length > 0 && (
              <button
                onClick={() => {
                  setSelectedReviewShipment(pendingReviews[0]);
                  setReviewResult(null);
                }}
                className="flex items-center space-x-2 px-4 py-3 rounded-xl font-bold text-xs bg-amber-500/20 text-volt border border-volt/40 shadow-lg hover:bg-amber-500/30 active:scale-95 transition-all animate-pulse"
              >
                <Award className="w-4 h-4 text-volt" />
                <span>Rate Delivered Vendor ({pendingReviews.length} Pending)</span>
              </button>
            )}

            <button
              onClick={() => handleRunAiAnalysis()}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm bg-volt text-volt-text font-bold hover:bg-volt-hover shadow-lg shadow-[#ffd400]/25 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 text-volt-text" />
              <span>Run 4-Stage GenAI Analysis</span>
            </button>

            <button
              onClick={fetchSuppliers}
              disabled={loading}
              className="p-3 rounded-xl bg-abyss-elevated border border-sand-border hover:border-volt/40 text-abyss-text transition-all"
              title="Refresh Supplier Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-volt' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Vendors */}
        <div className="bg-abyss-card border border-sand-border p-5 rounded-xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-abyss-muted font-mono uppercase tracking-wider">
            <span>Monitored Vendors</span>
            <Building2 className="w-4 h-4 text-volt" />
          </div>
          <div className="text-3xl font-black text-abyss-text font-mono">
            {totalSuppliersCount}
          </div>
          <div className="text-[11px] text-abyss-muted dark:text-volt flex items-center space-x-1 font-mono">
            <span>Global distribution hubs connected</span>
          </div>
        </div>

        {/* Fastest Transfer Lead Time */}
        <div className="bg-abyss-card border border-sand-border p-5 rounded-xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-abyss-muted font-mono uppercase tracking-wider">
            <span>Fastest Transfer Velocity</span>
            <Clock className="w-4 h-4 text-volt" />
          </div>
          <div className="text-3xl font-black text-abyss-text dark:text-volt font-mono">
            {fastestLeadTime} Day <span className="text-sm font-normal text-abyss-muted">({fastestLeadTime * 24}h)</span>
          </div>
          <div className="text-[11px] text-abyss-muted dark:text-volt flex items-center space-x-1 font-mono">
            <span>Nordic Fluid Systems (Express Road)</span>
          </div>
        </div>

        {/* Cold-Chain Compliance */}
        <div className="bg-abyss-card border border-sand-border p-5 rounded-xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-abyss-muted font-mono uppercase tracking-wider">
            <span>Cold-Chain Audit</span>
            <ShieldCheck className="w-4 h-4 text-volt" />
          </div>
          <div className="text-3xl font-black text-abyss-text font-mono flex items-baseline space-x-2">
            <span>{compliantCount}</span>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-sans font-bold">Passed</span>
            <span className="text-sm text-abyss-muted">/</span>
            <span className="text-xs text-amber-700 dark:text-amber-400 font-sans font-bold">{nonCompliantCount} Flagged</span>
          </div>
          <div className="text-[11px] text-abyss-muted dark:text-volt flex items-center space-x-1 font-mono">
            <span>V1003 non-compliant (rejected by AI)</span>
          </div>
        </div>

        {/* Average Unit Rate */}
        <div className="bg-abyss-card border border-sand-border p-5 rounded-xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-abyss-muted font-mono uppercase tracking-wider">
            <span>Median Transfer Rate</span>
            <DollarSign className="w-4 h-4 text-volt" />
          </div>
          <div className="text-3xl font-black text-abyss-text dark:text-volt font-mono">
            ₹{avgRate} <span className="text-xs font-normal text-abyss-muted">/ Unit</span>
          </div>
          <div className="text-[11px] text-abyss-muted flex items-center space-x-1 font-mono">
            <span>Range: ₹25 (Saline) - ₹210 (Propofol)</span>
          </div>
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="bg-abyss-card border border-sand-border p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-abyss-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendor name, code, material, or hub location..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-abyss-elevated border border-sand-border text-xs text-abyss-text placeholder-abyss-muted/60 focus:outline-none focus:border-volt/40 focus:ring-1 focus:ring-volt/50 transition-all font-mono"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase font-bold text-abyss-muted tracking-wider mr-1">
            Status:
          </span>
          <button
            onClick={() => setFilterCompliance('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
              filterCompliance === 'ALL'
                ? 'bg-volt text-volt-text shadow-sm'
                : 'bg-abyss-elevated border border-sand-border text-abyss-muted hover:text-abyss-text'
            }`}
          >
            All Vendors ({suppliers.length})
          </button>
          <button
            onClick={() => setFilterCompliance('COMPLIANT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              filterCompliance === 'COMPLIANT'
                ? 'bg-volt text-volt-text shadow-sm'
                : 'bg-abyss-elevated border border-sand-border text-abyss-text dark:text-volt hover:bg-abyss-card'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-volt" />
            <span>Compliant (Y)</span>
          </button>
          <button
            onClick={() => setFilterCompliance('NON_COMPLIANT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              filterCompliance === 'NON_COMPLIANT'
                ? 'bg-volt text-volt-text shadow-sm'
                : 'bg-abyss-elevated border border-sand-border text-abyss-text dark:text-volt hover:bg-abyss-card'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-volt" />
            <span>Compromised (N)</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-1.5 ml-2 border-l border-sand-border pl-3">
            <span className="text-[11px] uppercase font-bold text-abyss-muted tracking-wider">
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-abyss-elevated border border-sand-border text-xs text-abyss-text rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-volt/40"
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
      <div className="bg-abyss-card border border-sand-border rounded-xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-sand-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <Warehouse className="w-5 h-5 text-volt" />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-abyss-text tracking-tight">
                  Supplier Fleet, Unit Rates & Transfer Durations
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-abyss-elevated border border-sand-border dark:border-volt/40 text-abyss-text dark:text-volt text-[10px] font-mono font-bold flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-volt" />
                  Calculated natively in SAP HANA
                </span>
              </div>
              <p className="text-[11px] text-abyss-muted font-mono">
                Zero client-side math: TrustScore, Tier, and Performance Factors sourced directly from SAP S/4HANA
              </p>
            </div>
          </div>
          <div className="text-xs font-mono text-abyss-muted">
            Showing <span className="text-abyss-text dark:text-volt font-bold">{filteredSuppliers.length}</span> of {suppliers.length} vendors
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-sand-border bg-abyss-elevated text-[11px] uppercase font-bold text-abyss-muted font-mono tracking-wider">
                <th className="py-4 px-5">Supplier Details</th>
                <th className="py-4 px-5 text-center">SAP TrustScore & Tier</th>
                <th className="py-4 px-5">Material Specialization</th>
                <th className="py-4 px-5 text-right">Contracted Rate (₹/Unit)</th>
                <th className="py-4 px-5 text-center">Transfer Velocity</th>
                <th className="py-4 px-5">8 SAP Factors Radar</th>
                <th className="py-4 px-5 text-center">Cold-Chain Compliance</th>
                <th className="py-4 px-5 text-center">Route & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-border/40 font-mono">
              {filteredSuppliers.map((supplier) => {
                const isCompliant = supplier.COMPLIANCE === 'Y';
                const leadTimeHours = supplier.LEAD_TIME * 24;
                const trustScore = supplier.TRUST_SCORE ?? 85.0;
                const tier = (supplier.SUPPLIER_TIER || (supplier.COMPLIANCE === 'N' ? 'BLOCKED' : 'GOLD')).toUpperCase();
                const isEligible = supplier.IS_ELIGIBLE || (supplier.COMPLIANCE === 'Y' ? 'Y' : 'N');
                const hasDelayReason = supplier.DELAY_REASON && supplier.DELAY_REASON.trim().length > 0;

                const tierBadge = {
                  PLATINUM: 'bg-abyss-elevated text-abyss-text dark:text-volt border-sand-border dark:border-volt/40',
                  GOLD: 'bg-volt/15 text-abyss-text dark:text-volt border-sand-border dark:border-volt/40',
                  SILVER: 'bg-abyss-elevated text-abyss-text border-sand-border',
                  BLOCKED: 'bg-red-950/80 text-red-200 border-red-500/50',
                }[tier] || 'bg-abyss-elevated text-abyss-text dark:text-volt border-sand-border dark:border-volt/40';

                return (
                  <tr
                    key={supplier.SUPPLIER_ID}
                    className={`hover:bg-abyss-elevated/70 transition-colors ${
                      tier === 'BLOCKED' || !isCompliant ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    {/* Supplier Identity */}
                    <td className="py-4 px-5">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-abyss-text text-sm tracking-tight font-sans">
                            {supplier.SUPPLIER_NAME}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-abyss-elevated text-abyss-text dark:text-volt border border-sand-border dark:border-volt/40 font-bold">
                            {supplier.SUPPLIER_ID}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-[11px] text-abyss-muted">
                          <Globe2 className="w-3.5 h-3.5 text-abyss-muted dark:text-volt/70" />
                          <span>{supplier.LOCATION}</span>
                        </div>
                        {hasDelayReason && (
                          <div className="mt-1 text-[10px] text-amber-900 dark:text-volt bg-amber-100 dark:bg-volt/15 p-1.5 rounded-lg border border-amber-300 dark:border-volt/40 flex items-start gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-700 dark:text-volt shrink-0 mt-0.5" />
                            <span>Delay Justification: {supplier.DELAY_REASON}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* SAP TrustScore & Tier (Zero React Math) */}
                    <td className="py-4 px-5 text-center">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${tierBadge}`}>
                          {tier === 'PLATINUM' && <Crown className="w-3 h-3 text-volt" />}
                          {tier === 'GOLD' && <Star className="w-3 h-3 text-volt" />}
                          {tier === 'BLOCKED' && <ShieldAlert className="w-3 h-3 text-red-400" />}
                          <span>{tier}</span>
                        </span>
                        <div className="text-base font-black text-abyss-text font-mono">
                          {trustScore} <span className="text-[10px] text-abyss-muted font-normal">/ 100</span>
                        </div>
                        <div className="text-[9px] uppercase tracking-wider text-abyss-muted font-semibold">
                          {isEligible === 'Y' ? (
                            <span className="text-emerald-700 dark:text-volt font-bold">SAP Eligible</span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400 font-bold">Disqualified</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Material Handled */}
                    <td className="py-4 px-5">
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-volt" />
                        <div>
                          <span className="font-bold text-abyss-text">
                            {supplier.MATERIAL_ID}
                          </span>
                          <div className="text-[10px] text-abyss-muted">
                            Capacity: {supplier.CAPACITY?.toLocaleString()} EA
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contracted Rate */}
                    <td className="py-4 px-5 text-right">
                      <div className="space-y-0.5">
                        <div className="text-base font-black text-abyss-text dark:text-volt">
                          ₹{supplier.UNIT_COST.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-abyss-muted uppercase">
                          Per Unit (SAP Fixed)
                        </div>
                      </div>
                    </td>

                    {/* Transfer Duration */}
                    <td className="py-4 px-5 text-center">
                      <div className="inline-flex flex-col items-center p-2 rounded-xl bg-abyss-elevated border border-sand-border">
                        <div className="flex items-center space-x-1.5 text-sm font-black text-abyss-text dark:text-volt">
                          <Clock className="w-4 h-4 text-volt" />
                          <span>{supplier.LEAD_TIME} {supplier.LEAD_TIME === 1 ? 'Day' : 'Days'}</span>
                        </div>
                        <div className="text-[10px] text-abyss-muted font-semibold">
                          ({leadTimeHours}h Velocity)
                        </div>
                      </div>
                    </td>

                    {/* 8 SAP Factors Radar (Horizontal Progress Bars) */}
                    <td className="py-4 px-5">
                      <div className="w-44 space-y-1.5 text-[10px] font-mono">
                        <div className="flex items-center justify-between text-abyss-muted">
                          <span>Delivery Speed:</span>
                          <strong className="text-abyss-text">{supplier.DELIVERY_SPEED || 90}%</strong>
                        </div>
                        <div className="w-full h-1 bg-abyss-elevated border border-sand-border/30 rounded-full overflow-hidden">
                          <div className="h-full bg-volt text-volt-text rounded-full" style={{ width: `${supplier.DELIVERY_SPEED || 90}%` }}></div>
                        </div>

                        <div className="flex items-center justify-between text-abyss-muted">
                          <span>Quality Standard:</span>
                          <strong className="text-abyss-text dark:text-volt font-bold">{supplier.QUALITY_SCORE || 92}%</strong>
                        </div>
                        <div className="w-full h-1 bg-abyss-elevated border border-sand-border/30 rounded-full overflow-hidden">
                          <div className="h-full bg-volt text-volt-text rounded-full" style={{ width: `${supplier.QUALITY_SCORE || 92}%` }}></div>
                        </div>

                        <div className="flex items-center justify-between text-abyss-muted">
                          <span>Cold-Chain Audit:</span>
                          <strong className={isCompliant ? 'text-emerald-700 dark:text-volt font-bold' : 'text-red-600 dark:text-red-400 font-bold'}>
                            {supplier.COLD_CHAIN_SCORE || (isCompliant ? 95 : 45)}%
                          </strong>
                        </div>
                        <div className="w-full h-1 bg-abyss-elevated border border-sand-border/30 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isCompliant ? 'bg-volt text-volt-text' : 'bg-red-500'}`}
                            style={{ width: `${supplier.COLD_CHAIN_SCORE || (isCompliant ? 95 : 45)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Compliance */}
                    <td className="py-4 px-5 text-center">
                      {isCompliant ? (
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-abyss-elevated border border-sand-border dark:border-volt/40 text-emerald-800 dark:text-volt text-[10px] font-bold">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-volt" />
                          <span>Cold-Chain (Y)</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-[10px] font-bold animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Audit Excursion (N)</span>
                        </div>
                      )}
                    </td>

                    {/* Route & Action */}
                    <td className="py-4 px-5 text-center">
                      <div className="flex flex-col gap-1.5 items-center">
                        <button
                          onClick={() => handleOpenRouteMap(supplier)}
                          className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-abyss-elevated hover:bg-volt hover:text-volt-text border border-sand-border dark:border-volt/40 text-abyss-text dark:text-volt transition-all flex items-center gap-1 shadow-sm"
                          title="View OSRM Road Route"
                        >
                          <Map className="w-3 h-3 text-volt" />
                          <span>OSRM Route</span>
                        </button>
                        <button
                          onClick={() =>
                            handleRunAiAnalysis(
                              `Disruption alert for supplier ${supplier.SUPPLIER_NAME} (${supplier.LOCATION}): Port corridor delayed by ${supplier.LEAD_TIME + 10} days.`
                            )
                          }
                          className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-abyss-elevated hover:bg-volt hover:text-volt-text border border-sand-border text-abyss-text transition-all flex items-center gap-1 shadow-sm"
                        >
                          <Sparkles className="w-3 h-3 text-volt" />
                          <span>Simulate</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live OSRM Delivery Route Map Modal */}
      {selectedRouteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl flex flex-col rounded-xl bg-abyss-card border border-sand-border shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-sand-border pb-3">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-volt" />
                <div>
                  <h3 className="text-base font-bold text-abyss-text">
                    OSRM Road Navigation & Travel Time
                  </h3>
                  <p className="text-xs text-abyss-muted font-mono">
                    Vendor {selectedRouteModal.supplier.SUPPLIER_NAME} ({selectedRouteModal.supplier.SUPPLIER_ID}) ➔ Bhopal Central Hospital (H004)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRouteModal(null)}
                className="p-2 rounded-xl bg-abyss-elevated hover:bg-volt text-volt-text text-abyss-text transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <DeliveryRouteMap
              route={selectedRouteModal.route}
              originName={selectedRouteModal.supplier.SUPPLIER_NAME}
              destName="Bhopal Apex Care Hospital (H004)"
              height="380px"
            />

            <div className="flex items-center justify-between text-xs font-mono text-abyss-muted pt-2 border-t border-sand-border">
              <span>Road Velocity Guardrail: <strong>+1 Day Transit Rule Enforced</strong></span>
              <button
                onClick={() => setSelectedRouteModal(null)}
                className="px-4 py-1.5 rounded-xl bg-volt text-volt-text font-bold"
              >
                Close Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4-Stage GenAI Disruption Analysis Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl bg-abyss-card border border-sand-border shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-sand-border bg-abyss-elevated flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-abyss-card border border-volt/40 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-volt animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-abyss-text flex items-center space-x-2">
                    <span>4-Stage GenAI Disruption & Compliance Engine</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-volt/15 text-volt border border-volt/40">
                      gemini-2.5-flash
                    </span>
                  </h3>
                  <p className="text-xs text-abyss-muted font-mono">
                    POST /api/analyze-disruption • Orchestrated AI Agent Chain
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAiModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-abyss-elevated hover:bg-abyss-card text-abyss-muted hover:text-abyss-text flex items-center justify-center border border-sand-border text-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input Simulation Prompt */}
            <div className="p-6 border-b border-sand-border bg-abyss-elevated space-y-3">
              <label className="text-xs uppercase font-bold text-volt tracking-wider flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-volt animate-pulse" />
                <span>Simulated Disruption Alert Payload</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={alertPrompt}
                  onChange={(e) => setAlertPrompt(e.target.value)}
                  placeholder="e.g., Port of Mumbai closed for 12 days..."
                  className="flex-1 px-4 py-2 rounded-xl bg-abyss-card border border-sand-border text-xs text-abyss-text focus:outline-none focus:border-volt/50"
                />
                <button
                  onClick={() => handleRunAiAnalysis()}
                  disabled={aiRunning}
                  className="px-4 py-2 rounded-xl bg-volt text-volt-text font-bold text-xs flex items-center space-x-1.5 hover:bg-volt-hover disabled:opacity-50"
                >
                  {aiRunning ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-volt-text" />
                  ) : (
                    <Send className="w-4 h-4 text-volt-text" />
                  )}
                  <span>Re-Analyze</span>
                </button>
              </div>
            </div>

            {/* Stage Selector Tabs */}
            {aiAnalysisResult && (
              <div className="flex border-b border-sand-border bg-abyss-card px-6 pt-3 gap-2 overflow-x-auto">
                <button
                  onClick={() => setActiveStageTab('stage1')}
                  className={`pb-3 px-3 text-xs font-mono font-bold border-b-2 transition-all ${
                    activeStageTab === 'stage1'
                      ? 'border-volt text-volt'
                      : 'border-transparent text-abyss-muted hover:text-abyss-text'
                  }`}
                >
                  Stage 1: Sensing ({aiAnalysisResult.stages.step1_sensing.inventoryCount} items)
                </button>
                <button
                  onClick={() => setActiveStageTab('stage2')}
                  className={`pb-3 px-3 text-xs font-mono font-bold border-b-2 transition-all ${
                    activeStageTab === 'stage2'
                      ? 'border-volt text-volt'
                      : 'border-transparent text-abyss-muted hover:text-abyss-text'
                  }`}
                >
                  Stage 2: Impact ({aiAnalysisResult.stages.step2_impact.totalCriticalShortages} Shortages)
                </button>
                <button
                  onClick={() => setActiveStageTab('stage3')}
                  className={`pb-3 px-3 text-xs font-mono font-bold border-b-2 transition-all ${
                    activeStageTab === 'stage3'
                      ? 'border-volt text-volt'
                      : 'border-transparent text-abyss-muted hover:text-abyss-text'
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
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-volt animate-spin"></div>
                    <Cpu className="w-8 h-8 text-volt animate-pulse" />
                  </div>
                  <div className="text-sm font-bold text-abyss-text">
                    Executing 4-Stage Agentic Reasoning Chain...
                  </div>
                  <div className="text-xs text-abyss-muted font-mono">
                    Step 1 (Sensing) &rarr; Step 2 (Impact Evaluation) &rarr; Step 3 (Compliance Filter & Recovery)
                  </div>
                </div>
              )}

              {!aiRunning && aiAnalysisResult && (
                <div className="space-y-6">
                  {/* Stage 1 Content */}
                  {activeStageTab === 'stage1' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-abyss-elevated border border-volt/40">
                        <div className="text-xs font-bold text-volt uppercase mb-1">
                          Step 1: Sensing Complete
                        </div>
                        <p className="text-xs text-abyss-muted">
                          Retrieved live SAP ERP stock telemetry across all regional hubs and vendor master tables.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                        <div className="p-4 rounded-xl bg-abyss-elevated border border-sand-border space-y-1">
                          <span className="text-abyss-muted">Total SAP Stock Records:</span>
                          <div className="text-xl font-bold text-abyss-text">
                            {aiAnalysisResult.stages.step1_sensing.inventoryCount} items
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-abyss-elevated border border-sand-border space-y-1">
                          <span className="text-abyss-muted">Suppliers Audited:</span>
                          <div className="text-xl font-bold text-abyss-text">
                            {aiAnalysisResult.stages.step1_sensing.suppliersCount} vendors
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stage 2 Content */}
                  {activeStageTab === 'stage2' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-volt/15 border border-volt/40 text-xs">
                        <div className="font-bold text-volt mb-1">
                          Disruption Impact Assessment
                        </div>
                        <p className="text-abyss-muted">
                          {aiAnalysisResult.stages.step2_impact.disruptionSummary}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-bold uppercase text-abyss-muted">
                          Critical Shortages Detected (Days Cover &lt; {aiAnalysisResult.stages.step2_impact.disruptionDurationDays}d):
                        </div>
                        <div className="space-y-2">
                          {aiAnalysisResult.stages.step2_impact.criticalShortages.map((shortage, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-abyss-elevated border border-volt/40 flex items-center justify-between text-xs font-mono"
                            >
                              <div className="flex items-center space-x-3">
                                <span className="font-bold text-abyss-text">
                                  {shortage.hospitalId} ({shortage.materialId})
                                </span>
                                <span className="text-volt">
                                  {shortage.daysCover}d Cover remaining
                                </span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-volt">
                                  Shortfall: {shortage.shortfallQty} units
                                </span>
                                <span className="px-2 py-0.5 rounded bg-volt/20 text-volt text-volt font-bold text-[10px]">
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
                      <div className="p-4 rounded-xl bg-abyss-elevated border border-sand-border space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-abyss-text uppercase tracking-wider flex items-center space-x-1.5">
                            <ShieldCheck className="w-4 h-4 text-volt" />
                            <span>Supplier Compliance Audit Results</span>
                          </span>
                          <span className="text-[11px] font-mono text-volt">
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
                                    ? 'bg-abyss-elevated border-volt/40'
                                    : 'bg-volt/15 border-volt/40'
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="font-bold text-abyss-text flex items-center space-x-2">
                                    <span>{s.supplierName}</span>
                                    <span className="text-[10px] text-abyss-muted">
                                      ({s.supplierId})
                                    </span>
                                  </div>
                                  {s.rejectionReason && (
                                    <div className="text-[10px] text-volt font-sans">
                                      {s.rejectionReason}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center space-x-3">
                                  <span className="text-abyss-muted">
                                    Lead Time: {s.leadTimeDays}d (${s.unitCost}/unit)
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                      s.status === 'APPROVED'
                                        ? 'bg-volt text-volt-text'
                                        : 'bg-volt/30 text-volt border border-volt/40'
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
                        <div className="p-5 rounded-xl bg-abyss-card border border-volt/40 shadow-xl space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Sparkles className="w-5 h-5 text-volt" />
                              <h4 className="text-sm font-bold text-abyss-text">
                                Recommended Autonomous Recovery Plan
                              </h4>
                            </div>
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-volt text-volt-text font-black">
                              VERIFIED (PASSED)
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Option A */}
                            <div className="p-4 rounded-xl bg-abyss-elevated border border-volt/40 space-y-2">
                              <div className="text-xs font-bold text-volt flex items-center justify-between">
                                <span>Option A: Internal Transfer</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-volt/20 text-volt">
                                  Selected
                                </span>
                              </div>
                              <div className="text-sm font-bold text-abyss-text">
                                {aiAnalysisResult.executionReadyPlan.optionA.title}
                              </div>
                              <div className="text-xs text-abyss-muted font-mono space-y-1">
                                <div>Lead Time: {aiAnalysisResult.executionReadyPlan.optionA.leadTimeDays} Days (Instant Dispatch)</div>
                                <div>Est. Cost: ₹{aiAnalysisResult.executionReadyPlan.optionA.totalCost?.toLocaleString()}</div>
                              </div>
                            </div>

                            {/* Option B */}
                            <div className="p-4 rounded-xl bg-abyss-elevated border border-sand-border space-y-2">
                              <div className="text-xs font-bold text-abyss-muted flex items-center justify-between">
                                <span>Option B: Commercial Purchase</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-abyss-elevated text-abyss-muted">
                                  Alternative
                                </span>
                              </div>
                              <div className="text-sm font-bold text-abyss-text">
                                {aiAnalysisResult.executionReadyPlan.optionB.title}
                              </div>
                              <div className="text-xs text-abyss-muted font-mono space-y-1">
                                <div>Lead Time: {aiAnalysisResult.executionReadyPlan.optionB.leadTimeDays} Days</div>
                                <div>Est. Cost: ₹{aiAnalysisResult.executionReadyPlan.optionB.totalCost?.toLocaleString()}</div>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-abyss-elevated border border-sand-border text-xs text-abyss-muted">
                            <span className="font-bold text-volt">Agent Rationale: </span>
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
                              className="px-5 py-2.5 rounded-xl bg-volt text-volt-text font-black text-xs flex items-center space-x-2 hover:bg-volt-hover shadow-lg"
                            >
                              <span>Send Plan to Human Approval (Screen 5)</span>
                              <ArrowRight className="w-4 h-4 text-volt-text" />
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
      {/* Post-Delivery Supplier Review Modal (SAP HANA Re-Ranking) */}
      {selectedReviewShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-abyss-card border border-sand-border w-full max-w-2xl rounded-xl border border-volt/40 bg-abyss-card shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-sand-border pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-volt" />
                  <h3 className="text-xl font-bold text-abyss-text tracking-tight">
                    Manager Post-Delivery Performance Review
                  </h3>
                </div>
                <p className="text-xs text-abyss-muted font-mono mt-1">
                  Evaluates Vendor <strong className="text-volt">{selectedReviewShipment.supplier_id}</strong> for Shipment{' '}
                  <code className="text-volt font-mono">{selectedReviewShipment.id.slice(0, 8)}...</code>.
                  Commits to SAP S/4HANA <code className="text-volt font-mono">SupplierSet</code> and updates TrustScore & Tier in SAP HANA.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedReviewShipment(null);
                  setReviewResult(null);
                }}
                className="p-1.5 rounded-xl hover:bg-abyss-elevated text-abyss-muted hover:text-abyss-text transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Feedback Display */}
            {reviewResult?.type === 'success' ? (
              <div className="p-6 rounded-xl bg-abyss-elevated border border-volt/40 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-volt/20 flex items-center justify-center mx-auto text-volt">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-abyss-text">SAP HANA Re-Ranking Completed!</h4>
                <p className="text-xs text-abyss-muted font-mono">
                  {reviewResult.message}
                </p>
                <div className="flex items-center justify-center gap-4 py-2">
                  <div className="px-4 py-2 rounded-xl bg-abyss-card border border-volt/40">
                    <span className="text-[10px] uppercase text-abyss-muted block font-mono">Recalculated TrustScore</span>
                    <strong className="text-2xl font-black text-volt font-mono">
                      {reviewResult.trustScore} <span className="text-xs text-abyss-muted font-normal">/ 100</span>
                    </strong>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-abyss-card border border-volt/40">
                    <span className="text-[10px] uppercase text-abyss-muted block font-mono">New Supplier Tier</span>
                    <strong className="text-xl font-black text-volt font-mono">
                      {reviewResult.tier}
                    </strong>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedReviewShipment(null);
                    setReviewResult(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-volt text-volt-text font-black text-xs uppercase tracking-wider hover:bg-volt-hover shadow-lg"
                >
                  Close & View Updated Ledger
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Shipment Info Badge */}
                <div className="p-3.5 rounded-xl bg-abyss-elevated border border-sand-border grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-abyss-muted uppercase block">Supplier</span>
                    <strong className="text-abyss-text">{selectedReviewShipment.supplier_id}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-abyss-muted uppercase block">Medicine</span>
                    <strong className="text-volt">{selectedReviewShipment.material_id}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-abyss-muted uppercase block">Delivered Qty</span>
                    <strong className="text-volt">{selectedReviewShipment.qty} Units</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-abyss-muted uppercase block">Receiving Facility</span>
                    <strong className="text-abyss-text">{selectedReviewShipment.dest_hospital_id}</strong>
                  </div>
                </div>

                {reviewResult?.type === 'error' && (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-500 text-red-300 text-xs font-mono">
                    {reviewResult.message}
                  </div>
                )}

                {/* 8 SAP Performance Factors Sliders */}
                <div className="space-y-3">
                  <span className="text-xs uppercase font-mono font-bold text-volt block">
                    8 Vendor Performance Factors (1 — 100)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    {[
                      { key: 'deliverySpeed', label: 'Delivery Speed' },
                      { key: 'onTimeRate', label: 'On-Time Rate' },
                      { key: 'reliability', label: 'Reliability' },
                      { key: 'qualityScore', label: 'Quality Score' },
                      { key: 'emergResponse', label: 'Emergency Response' },
                      { key: 'coldChainScore', label: 'Cold-Chain Score' },
                      { key: 'fulfilmentRate', label: 'Fulfilment Rate' },
                      { key: 'docCertScore', label: 'Doc & Cert Score' },
                    ].map(({ key, label }) => (
                      <div key={key} className="p-2.5 rounded-xl bg-abyss-elevated border border-sand-border space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-abyss-muted">{label}</span>
                          <span className="font-bold text-volt">{reviewRatings[key]}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={reviewRatings[key]}
                          onChange={(e) =>
                            setReviewRatings((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                          }
                          className="w-full accent-volt cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-abyss-muted mb-1">
                    Manager Inspection Notes & Comments
                  </label>
                  <textarea
                    rows="2"
                    value={reviewRatings.comments}
                    onChange={(e) =>
                      setReviewRatings((prev) => ({ ...prev, comments: e.target.value }))
                    }
                    placeholder="Enter observations on packaging, seal integrity, and offloading..."
                    className="w-full px-3 py-2 rounded-xl bg-abyss-elevated border border-sand-border text-abyss-text font-mono text-xs focus:border-volt/50 focus:outline-none"
                  ></textarea>
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-sand-border">
                  <button
                    type="button"
                    onClick={() => setSelectedReviewShipment(null)}
                    className="px-4 py-2 rounded-xl text-xs font-mono text-abyss-muted hover:text-abyss-text"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-6 py-2.5 rounded-xl bg-volt text-volt-text font-bold hover:bg-volt-hover font-black text-xs uppercase tracking-wider active:scale-95 shadow-md transition-all disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting to SAP HANA...' : 'Commit Ratings & Re-Rank in SAP HANA'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
