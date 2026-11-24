import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { usePulseChain } from '../../context/PulseChainContext';
import DeliveryRouteMap from '../DeliveryRouteMap';
import CopyButton from '../common/CopyButton';
import ConfirmModal from '../common/ConfirmModal';
import {
  BrainCircuit,
  Building2,
  CheckCircle2,
  Clock,
  Cpu,
  DollarSign,
  Package,
  ShieldAlert,
  ShieldCheck,
  Truck,
  MapPin,
  Crown,
  Navigation,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api';

export default function Screen3RecoveryPlanning({
  selectedShortage,
  selectedPlan,
  onSelectPlan,
  onProceedToCompliance,
}) {
  const { supplierBids, fetchSupplierBids } = usePulseChain();
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [recommendationData, setRecommendationData] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // Modal confirmation for direct bid acceptance
  const [confirmBidModalOpen, setConfirmBidModalOpen] = useState(false);
  const [pendingBidToAccept, setPendingBidToAccept] = useState(null);

  // Target hospital and medicine in distress
  const target = selectedShortage || {
    HOSPITAL_ID: 'H004',
    HOSPITAL_NAME: 'Bhopal Apex Care Hospital',
    CITY: 'BHOPAL',
    MATERIAL_ID: 'AMX002',
    STOCK_QTY: 110,
    DAILY_USE: 45,
    UNIT: 'VIAL',
    daysCover: 2,
  };

  const targetCity = target.CITY || 'BHOPAL';
  const bufferTransferQty = (target.DAILY_USE || 45) * 5; // 5-day buffer

  // Fetch /api/suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoadingSuppliers(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/suppliers`);
        setSuppliers(response.data?.data || []);
      } catch (err) {
        console.error('Failed to load suppliers:', err);
      } finally {
        setLoadingSuppliers(false);
      }
    };
    fetchSuppliers();
    if (fetchSupplierBids) fetchSupplierBids();
  }, [fetchSupplierBids]);

  // Fetch /api/recommend-suppliers/:hospitalId/:materialId
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoadingRecs(true);
      try {
        const hId = target.HOSPITAL_ID || 'H004';
        const mId = target.MATERIAL_ID || 'AMX002';
        const res = await axios.get(`${API_BASE_URL}/recommend-suppliers/${hId}/${mId}`);
        if (res.data?.success) {
          setRecommendationData(res.data);
        }
      } catch (err) {
        console.warn('Failed to load supplier recommendations:', err.message);
      } finally {
        setLoadingRecs(false);
      }
    };
    fetchRecommendations();
  }, [target.HOSPITAL_ID, target.MATERIAL_ID]);

  // Live bids for this material
  const liveBidsForMaterial = useMemo(() => {
    return (supplierBids || []).filter((b) => b.materialId === target.MATERIAL_ID);
  }, [supplierBids, target.MATERIAL_ID]);

  // Active supplier selection state for Option B
  const [selectedBidId, setSelectedBidId] = useState(null);

  // Direct Accept Bid & Order handler
  const [acceptingBid, setAcceptingBid] = useState(false);
  const [orderDirectResult, setOrderDirectResult] = useState(null);

  const handleAcceptBidDirect = async (bidId) => {
    if (!bidId) return;
    setAcceptingBid(true);
    setOrderDirectResult(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/bids/${bidId}/accept`);
      if (res.data?.success) {
        setOrderDirectResult({
          type: 'success',
          message: `Bid accepted! Order created (${res.data.shipment?.id || 'PO-COMMITTED'}). Sent to destination hospital for Shopkeeper receipt approval.`,
          shipment: res.data.shipment,
        });
        if (fetchSupplierBids) fetchSupplierBids();
      }
    } catch (err) {
      setOrderDirectResult({
        type: 'error',
        message: err.response?.data?.message || err.response?.data?.error || 'Failed to accept bid.',
      });
    } finally {
      setAcceptingBid(false);
      setConfirmBidModalOpen(false);
    }
  };

  // Safe matching supplier resolution with strict fallbacks
  const matchingSupplier = useMemo(() => {
    if (selectedBidId) {
      const bid = liveBidsForMaterial.find((b) => b.id === selectedBidId);
      if (bid) {
        return {
          SUPPLIER_ID: bid.supplierId,
          SUPPLIER_NAME: bid.supplierName || `Vendor ${bid.supplierId}`,
          MATERIAL_ID: bid.materialId,
          LEAD_TIME: bid.leadTime || 2,
          CAPACITY: bid.capacity || 5000,
          UNIT_COST: bid.unitCost || 150,
          COMPLIANCE: bid.compliance || 'Y',
          LOCATION: 'Supplier Bidding Portal Quote',
          isLiveBid: true,
        };
      }
    }

    const matched =
      suppliers.find((s) => s.MATERIAL_ID === target.MATERIAL_ID) ||
      suppliers.find((s) => s.SUPPLIER_ID === 'V1001');

    if (matched) {
      return {
        ...matched,
        LEAD_TIME: matched.LEAD_TIME || 2,
        UNIT_COST: matched.UNIT_COST || 150,
        COMPLIANCE: matched.COMPLIANCE || 'Y',
        SUPPLIER_NAME: matched.SUPPLIER_NAME || `Vendor ${matched.SUPPLIER_ID}`,
        isLiveBid: false,
      };
    }

    return {
      SUPPLIER_ID: 'V1001',
      SUPPLIER_NAME: 'BioCare Logistics India',
      MATERIAL_ID: target.MATERIAL_ID || 'AMX002',
      LEAD_TIME: 2,
      CAPACITY: 5000,
      UNIT_COST: 150,
      COMPLIANCE: 'Y',
      LOCATION: 'Bhopal Freight Depot',
      isLiveBid: false,
    };
  }, [suppliers, target.MATERIAL_ID, selectedBidId, liveBidsForMaterial]);

  // Option A Data Structure (Internal Transfer - Geo-Fenced to Same City)
  const optionA = {
    id: 'OPTION_A',
    type: 'Internal Transfer',
    title: `Option A: Same-City Hub Transfer (H005 - ${targetCity})`,
    source: `Hospital H005 (Central Surplus Hub, ${targetCity})`,
    fromHospital: 'H005',
    toHospital: target.HOSPITAL_ID,
    materialId: target.MATERIAL_ID,
    qty: bufferTransferQty,
    leadTimeDays: 0,
    leadTimeFormatted: '0 Days (Immediate Same-City Courier)',
    costFormatted: '₹250 Total (₹15/unit transit fee)',
    costNumeric: 250,
    complianceStatus: 'Verified Cold-Chain (Y)',
    complianceFlag: 'Y',
    riskLevel: 'MINIMAL',
    riskDescription: `Zero transit delay within ${targetCity} municipal perimeter. Pre-cleared emergency fleet.`,
    routeClear: true,
    badge: 'SAME-CITY GEO FILTER ACTIVE',
    description: `Autonomously transfer stock from Central Surplus Hub H005 (${targetCity}) with 0 days lead time. Cross-city transfers (e.g. H006 in Indore) are excluded by policy.`,
  };

  // Option B Data Structure (External Purchase)
  const optionB = {
    id: 'OPTION_B',
    type: 'External Purchase',
    title: `Option B: Commercial Procurement (${matchingSupplier.SUPPLIER_NAME})`,
    source: `${matchingSupplier.SUPPLIER_NAME} (${matchingSupplier.SUPPLIER_ID})`,
    fromSupplier: matchingSupplier.SUPPLIER_ID,
    toHospital: target.HOSPITAL_ID,
    materialId: target.MATERIAL_ID,
    qty: bufferTransferQty,
    leadTimeDays: matchingSupplier.LEAD_TIME,
    leadTimeFormatted: `${matchingSupplier.LEAD_TIME} Days (${matchingSupplier.LEAD_TIME * 24}h Transit)`,
    costFormatted: `₹${(bufferTransferQty * matchingSupplier.UNIT_COST).toLocaleString()} Total (₹${matchingSupplier.UNIT_COST}/unit)`,
    costNumeric: bufferTransferQty * matchingSupplier.UNIT_COST,
    complianceStatus:
      matchingSupplier.COMPLIANCE === 'Y'
        ? 'Certified Cold-Chain (Y)'
        : 'Non-Compliant (N) - Excursion Risk',
    complianceFlag: matchingSupplier.COMPLIANCE,
    riskLevel: matchingSupplier.COMPLIANCE === 'Y' ? 'MODERATE' : 'CRITICAL',
    riskDescription:
      matchingSupplier.COMPLIANCE === 'Y'
        ? 'Subject to commercial courier and regional transit bottlenecks'
        : 'Failed cold-chain integrity standards (COMPLIANCE: N)',
    routeClear: matchingSupplier.COMPLIANCE === 'Y',
    badge: matchingSupplier.isLiveBid ? 'LIVE SUPPLIER BID' : 'EXTERNAL MARKET',
    description: `Procure from vendor ${matchingSupplier.SUPPLIER_ID} with ${matchingSupplier.LEAD_TIME} days lead time and commercial rate.`,
  };

  // Default active option
  const currentPlan = selectedPlan || optionA;

  return (
    <div className="space-y-5 text-abyss-text font-sans">
      {/* Top Bento Header */}
      <div className="rounded-xl bg-abyss-card border border-sand-border p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-abyss-elevated text-volt text-xs font-mono font-bold border border-sand-border mb-2">
              <BrainCircuit className="w-3.5 h-3.5 text-volt" />
              <span>AI SCENARIO GENERATOR • SAME-CITY POLICY ACTIVE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-abyss-text tracking-tight">
              Screen 3: Recovery Planning (AI Scenario Agent)
            </h2>
            <p className="text-xs text-abyss-muted mt-1 max-w-2xl font-mono">
              Mitigation strategy for facility{' '}
              <strong className="text-abyss-text">{target.HOSPITAL_ID}</strong> ({targetCity}) holding{' '}
              <strong className="text-volt">{target.daysCover}d Cover</strong> of{' '}
              <strong className="text-abyss-text">{target.MATERIAL_ID}</strong>. Required Buffer:{' '}
              <strong className="text-volt">+{bufferTransferQty} {target.UNIT || 'EA'}</strong> (+5 Days).
            </p>
          </div>

          <button
            type="button"
            onClick={() => onProceedToCompliance(currentPlan)}
            className="self-start md:self-center flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-volt text-volt-text hover:bg-volt-hover active:scale-95 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-[#FFD400]"
          >
            <span>Verify Compliance (Screen 4)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison: Option A vs Option B */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* OPTION A: SAME-CITY INTERNAL TRANSFER */}
        <div
          onClick={() => onSelectPlan(optionA)}
          className={`p-5 rounded-xl border cursor-pointer transition-all relative ${
            currentPlan.id === 'OPTION_A'
              ? 'bg-abyss-elevated border-volt shadow-md ring-1 ring-volt'
              : 'bg-abyss-card border-sand-border hover:border-volt/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-volt text-volt-text">
              <MapPin className="w-3 h-3" />
              <span>GEO-FILTER: SAME-CITY ONLY ({targetCity})</span>
            </span>

            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                currentPlan.id === 'OPTION_A'
                  ? 'border-volt bg-volt text-volt-text'
                  : 'border-sand-border'
              }`}
            >
              {currentPlan.id === 'OPTION_A' && <CheckCircle2 className="w-3.5 h-3.5 font-bold" />}
            </div>
          </div>

          <h3 className="text-base font-bold text-abyss-text tracking-tight">{optionA.title}</h3>
          <p className="text-xs text-abyss-muted mt-1 leading-relaxed">{optionA.description}</p>

          {/* Compressed 4-Parameter Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4 font-mono text-xs">
            <div className="p-2.5 rounded-lg bg-abyss-card border border-sand-border">
              <span className="text-abyss-muted block text-[10px] uppercase font-sans font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-volt" /> Lead Time
              </span>
              <span className="text-sm font-black text-volt block mt-0.5">0 Days</span>
              <span className="text-[10px] text-abyss-muted block truncate">Same-City Hub</span>
            </div>

            <div className="p-2.5 rounded-lg bg-abyss-card border border-sand-border">
              <span className="text-abyss-muted block text-[10px] uppercase font-sans font-bold flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-volt" /> Transit Cost
              </span>
              <span className="text-sm font-black text-abyss-text block mt-0.5">₹250</span>
              <span className="text-[10px] text-abyss-muted block truncate">₹15/unit fee</span>
            </div>

            <div className="p-2.5 rounded-lg bg-abyss-card border border-sand-border">
              <span className="text-abyss-muted block text-[10px] uppercase font-sans font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-volt" /> Cold-Chain
              </span>
              <span className="text-xs font-bold text-abyss-text block mt-0.5">100% Valid</span>
              <span className="text-[10px] text-volt block truncate font-bold">Compliant (Y)</span>
            </div>

            <div className="p-2.5 rounded-lg bg-abyss-card border border-sand-border">
              <span className="text-abyss-muted block text-[10px] uppercase font-sans font-bold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-volt" /> Risk Level
              </span>
              <span className="text-xs font-black text-volt block mt-0.5">MINIMAL</span>
              <span className="text-[10px] text-abyss-muted block truncate">Pre-Cleared</span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-abyss-muted flex items-center justify-between border-t border-sand-border pt-2.5">
            <span>Source: <strong className="text-abyss-text">{optionA.source}</strong></span>
            <CopyButton text={optionA.fromHospital} label="Hub ID" />
          </div>
        </div>

        {/* OPTION B: COMMERCIAL PROCUREMENT */}
        <div
          onClick={() => onSelectPlan(optionB)}
          className={`p-5 rounded-xl border cursor-pointer transition-all relative ${
            currentPlan.id === 'OPTION_B'
              ? 'bg-abyss-elevated border-volt shadow-md ring-1 ring-volt'
              : 'bg-abyss-card border-sand-border hover:border-volt/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-abyss-card text-volt border border-sand-border">
              <Truck className="w-3 h-3" />
              <span>{matchingSupplier.isLiveBid ? 'LIVE SUPPLIER BID' : 'COMMERCIAL PROCUREMENT'}</span>
            </span>

            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                currentPlan.id === 'OPTION_B'
                  ? 'border-volt bg-volt text-volt-text'
                  : 'border-sand-border'
              }`}
            >
              {currentPlan.id === 'OPTION_B' && <CheckCircle2 className="w-3.5 h-3.5 font-bold" />}
            </div>
          </div>

          <h3 className="text-base font-bold text-abyss-text tracking-tight">{optionB.title}</h3>
          <p className="text-xs text-abyss-muted mt-1 leading-relaxed">{optionB.description}</p>

          {/* Compressed 4-Parameter Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4 font-mono text-xs">
            <div className="p-2.5 rounded-lg bg-abyss-card border border-sand-border">
              <span className="text-abyss-muted block text-[10px] uppercase font-sans font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-volt" /> Lead Time
              </span>
              <span className="text-sm font-black text-abyss-text block mt-0.5">{matchingSupplier.LEAD_TIME} Days</span>
              <span className="text-[10px] text-abyss-muted block truncate">{matchingSupplier.LEAD_TIME * 24}h Courier</span>
            </div>

            <div className="p-2.5 rounded-lg bg-abyss-card border border-sand-border">
              <span className="text-abyss-muted block text-[10px] uppercase font-sans font-bold flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-volt" /> Total Cost
              </span>
              <span className="text-sm font-black text-volt block mt-0.5">
                ₹{(bufferTransferQty * matchingSupplier.UNIT_COST).toLocaleString()}
              </span>
              <span className="text-[10px] text-abyss-muted block truncate">₹{matchingSupplier.UNIT_COST}/unit</span>
            </div>

            <div className="p-2.5 rounded-lg bg-abyss-card border border-sand-border">
              <span className="text-abyss-muted block text-[10px] uppercase font-sans font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-volt" /> Cold-Chain
              </span>
              <span className={`text-xs font-bold block mt-0.5 ${matchingSupplier.COMPLIANCE === 'Y' ? 'text-abyss-text' : 'text-red-400'}`}>
                {matchingSupplier.COMPLIANCE === 'Y' ? 'Certified' : 'Flagged (N)'}
              </span>
              <span className="text-[10px] text-abyss-muted block truncate">
                {matchingSupplier.COMPLIANCE === 'Y' ? 'Cold-Chain (Y)' : 'Excursion Risk'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-abyss-card border border-sand-border">
              <span className="text-abyss-muted block text-[10px] uppercase font-sans font-bold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-volt" /> Risk Level
              </span>
              <span className={`text-xs font-black block mt-0.5 ${matchingSupplier.COMPLIANCE === 'Y' ? 'text-volt' : 'text-red-400'}`}>
                {matchingSupplier.COMPLIANCE === 'Y' ? 'MODERATE' : 'CRITICAL'}
              </span>
              <span className="text-[10px] text-abyss-muted block truncate">Commercial Fleet</span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-abyss-muted flex items-center justify-between border-t border-sand-border pt-2.5">
            <span>Vendor: <strong className="text-abyss-text">{matchingSupplier.SUPPLIER_NAME}</strong></span>
            <CopyButton text={matchingSupplier.SUPPLIER_ID} label="Vendor ID" />
          </div>
        </div>
      </div>

      {/* SAP S/4HANA Supplier Intelligence & Auto-Cascade Section (Safe Rendering) */}
      <div className="rounded-xl bg-abyss-card border border-sand-border p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sand-border pb-3">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-volt" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-abyss-text tracking-tight flex items-center gap-2">
                <span>SAP S/4HANA Supplier Intelligence & Auto-Cascade Ranking</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-abyss-elevated text-volt border border-sand-border font-bold">
                  HANA Scoring Engine
                </span>
              </h3>
              <p className="text-xs text-abyss-muted font-mono">
                Multi-factor ranking: SAP TrustScore, Tier rating, OSRM road velocity & environmental risk
              </p>
            </div>
          </div>
          <div className="text-xs font-mono text-abyss-muted">
            Evaluated: <strong className="text-abyss-text">{recommendationData?.totalEvaluated || 0}</strong> • Eligible: <strong className="text-volt">{recommendationData?.eligibleCount || 0}</strong> • Disqualified: <strong className="text-red-400">{recommendationData?.blockedCount || 0}</strong>
          </div>
        </div>

        {/* Primary Recommended Feasible Vendor Card */}
        {recommendationData?.primaryRecommendation ? (
          <div className="p-4 rounded-xl bg-abyss-elevated border border-sand-border space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded bg-volt text-volt-text text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                  <Crown className="w-3 h-3" /> #1 Recommended Feasible Vendor
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-abyss-card text-volt border border-sand-border font-bold">
                  {recommendationData.primaryRecommendation.supplierTier} TIER
                </span>
              </div>
              <div className="text-xs font-mono text-abyss-muted">
                TrustScore: <strong className="text-volt">{recommendationData.primaryRecommendation.trustScore} / 100</strong>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-bold text-abyss-text">
                  {recommendationData.primaryRecommendation.supplierName} ({recommendationData.primaryRecommendation.supplierId})
                </h4>
                <p className="text-xs font-mono text-abyss-muted mt-0.5">
                  Rate: <strong className="text-volt">₹{recommendationData.primaryRecommendation.unitCost}/unit</strong> • Capacity: <strong className="text-abyss-text">{recommendationData.primaryRecommendation.capacity} EA</strong> • Max Allowed Lead: <strong className="text-abyss-text">{recommendationData.primaryRecommendation.maxAllowedLeadDays}d</strong>
                </p>
              </div>
              <CopyButton text={recommendationData.primaryRecommendation.supplierId} label="Supplier ID" />
            </div>

            {/* Embedded Live Route Map */}
            <DeliveryRouteMap
              route={{
                originId: recommendationData.primaryRecommendation.supplierId,
                destId: target.HOSPITAL_ID,
                distanceKm: recommendationData.primaryRecommendation.distanceKm,
                durationHours: recommendationData.primaryRecommendation.durationHours,
                maxAllowedLeadDays: recommendationData.primaryRecommendation.maxAllowedLeadDays,
                geojson: recommendationData.primaryRecommendation.geojson,
                originCoords: recommendationData.primaryRecommendation.originCoords,
                destCoords: recommendationData.primaryRecommendation.destCoords,
              }}
              originName={recommendationData.primaryRecommendation.supplierName}
              destName={target.HOSPITAL_NAME || target.HOSPITAL_ID}
              height="260px"
            />
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-abyss-elevated border border-sand-border text-center text-xs font-mono text-abyss-muted">
            {loadingRecs ? 'Analyzing SAP HANA supplier intelligence...' : 'No external vendors evaluated for current material.'}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-4 rounded-xl bg-abyss-card border border-sand-border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div>
          <span className="text-[11px] text-abyss-muted block font-mono">Selected Strategy:</span>
          <div className="text-xs font-bold text-abyss-text flex items-center gap-2 mt-0.5">
            <span>{currentPlan.title}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-abyss-elevated text-volt border border-sand-border">
              Lead Time: {currentPlan.leadTimeDays}d • {currentPlan.costFormatted}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onProceedToCompliance(currentPlan)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-volt text-volt-text font-bold text-xs hover:bg-volt-hover active:scale-95 transition-all shadow-sm flex items-center justify-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-[#FFD400]"
        >
          <span>Confirm & Proceed to Compliance Check (Screen 4)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Confirmation Modal for Direct Bid Order */}
      <ConfirmModal
        isOpen={confirmBidModalOpen}
        title="Authorize Commercial Bid Order"
        message={`Are you sure you want to authorize the commercial purchase order with supplier ${pendingBidToAccept?.supplierId} for ${bufferTransferQty} units of ${target.MATERIAL_ID}? This creates an in-transit dispatch batch requiring destination Shopkeeper receipt.`}
        confirmLabel="Authorize Order"
        cancelLabel="Cancel"
        onConfirm={() => handleAcceptBidDirect(pendingBidToAccept?.id)}
        onClose={() => setConfirmBidModalOpen(false)}
      />
    </div>
  );
}
