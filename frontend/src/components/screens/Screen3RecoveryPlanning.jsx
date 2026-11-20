import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { usePulseChain } from '../../context/PulseChainContext';
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  DollarSign,
  Layers,
  Package,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Truck,
  Zap,
  MapPin,
  Tag,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function Screen3RecoveryPlanning({
  selectedShortage,
  selectedPlan,
  onSelectPlan,
  onProceedToCompliance,
}) {
  const { supplierBids, fetchSupplierBids } = usePulseChain();
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);

  // Target hospital and medicine in distress (default to H004 in Bhopal or selected)
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
        setSuppliers(response.data.data || []);
      } catch (err) {
        console.error('Failed to load suppliers:', err);
      } finally {
        setLoadingSuppliers(false);
      }
    };
    fetchSuppliers();
    if (fetchSupplierBids) fetchSupplierBids();
  }, [fetchSupplierBids]);

  // Check if any live bids were submitted via the Supplier Portal for this material
  const liveBidsForMaterial = useMemo(() => {
    return (supplierBids || []).filter((b) => b.materialId === target.MATERIAL_ID);
  }, [supplierBids, target.MATERIAL_ID]);

  // Active supplier selection state for Option B
  const [selectedBidId, setSelectedBidId] = useState(null);

  // Find supplier for this material or default to V1001
  const matchingSupplier = useMemo(() => {
    if (selectedBidId) {
      const bid = liveBidsForMaterial.find((b) => b.id === selectedBidId);
      if (bid) {
        return {
          SUPPLIER_ID: bid.supplierId,
          SUPPLIER_NAME: bid.supplierName || `Vendor ${bid.supplierId}`,
          MATERIAL_ID: bid.materialId,
          LEAD_TIME: bid.leadTime,
          CAPACITY: bid.capacity,
          UNIT_COST: bid.unitCost,
          COMPLIANCE: bid.compliance,
          LOCATION: 'Supplier Bidding Portal Quote',
          isLiveBid: true,
        };
      }
    }

    return (
      suppliers.find((s) => s.MATERIAL_ID === target.MATERIAL_ID) ||
      suppliers.find((s) => s.SUPPLIER_ID === 'V1001') || {
        SUPPLIER_ID: 'V1001',
        SUPPLIER_NAME: 'BioPharm Global Logistics',
        MATERIAL_ID: target.MATERIAL_ID,
        LEAD_TIME: 2,
        CAPACITY: 5000,
        UNIT_COST: 150,
        COMPLIANCE: 'Y',
        LOCATION: 'Frankfurt Central Hub',
        isLiveBid: false,
      }
    );
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
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Compact Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl glass-panel border border-[#e0e8e2]/15 bg-[#2c2e35]/70">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#2a3f3f] text-[#f0cd6e] text-[11px] font-mono font-semibold mb-1 border border-[#f0cd6e]/30">
            <BrainCircuit className="w-3 h-3 text-[#f0cd6e]" />
            <span>AI SCENARIO GENERATOR • SAME-CITY GEO POLICY ACTIVE</span>
          </div>
          <h2 className="text-xl font-black text-[#e0e8e2] tracking-tight">
            Screen 3: Recovery Planning (AI Scenario Agent)
          </h2>
          <p className="text-xs text-[#e0e8e2]/70 mt-0.5 max-w-2xl">
            Mitigation options for facility{' '}
            <strong className="text-white font-mono">{target.HOSPITAL_ID}</strong> in{' '}
            <strong className="text-[#f0cd6e] font-mono">{targetCity}</strong> holding{' '}
            <strong className="text-[#f0cd6e] font-mono">{target.daysCover}d Cover</strong> of{' '}
            <strong className="text-[#89c07e] font-mono">{target.MATERIAL_ID}</strong>. Required Buffer:{' '}
            <strong className="text-[#f0cd6e] font-mono">+{bufferTransferQty} {target.UNIT || 'EA'}</strong> (+5 Days).
          </p>
        </div>

        <button
          onClick={() => onProceedToCompliance(currentPlan)}
          className="self-start md:self-center flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-slate-950 shadow-lg shadow-orange-500/30 hover:brightness-110 active:scale-95 transition-all"
        >
          <span>Verify Compliance (Screen 4)</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
        </button>
      </div>

      {/* Side-by-Side Comparison: Option A vs Option B */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* OPTION A: SAME-CITY INTERNAL TRANSFER */}
        <div
          onClick={() => onSelectPlan(optionA)}
          className={`p-4 rounded-2xl glass-panel border cursor-pointer transition-all duration-150 relative overflow-hidden ${
            currentPlan.id === 'OPTION_A'
              ? 'border-[#89c07e] bg-gradient-to-br from-[#467750]/30 via-[#2c2e35]/90 to-[#2c2e35] shadow-xl ring-2 ring-[#89c07e]/60'
              : 'border-[#e0e8e2]/15 hover:border-[#89c07e]/40 bg-[#2c2e35]/60'
          }`}
        >
          {/* Card Top Pill: SAME-CITY GEO-FILTER BADGE */}
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-[#89c07e] text-slate-950">
              <MapPin className="w-3 h-3 text-slate-950" />
              <span>GEO-FILTER ACTIVE: SAME-CITY ONLY ({targetCity})</span>
            </span>

            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                currentPlan.id === 'OPTION_A'
                  ? 'border-[#89c07e] bg-[#89c07e] text-[#2c2e35]'
                  : 'border-[#e0e8e2]/30'
              }`}
            >
              {currentPlan.id === 'OPTION_A' && <CheckCircle2 className="w-3.5 h-3.5 font-bold" />}
            </div>
          </div>

          <h3 className="text-base font-bold text-white tracking-tight">{optionA.title}</h3>
          <p className="text-xs text-[#e0e8e2]/70 mt-1 line-clamp-2">{optionA.description}</p>

          {/* Compressed 4-Parameter Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3 font-mono text-xs">
            {/* 1. Lead Time */}
            <div className="p-2 rounded-xl bg-[#2a3f3f]/60 border border-[#e0e8e2]/10">
              <span className="text-[#e0e8e2]/60 block text-[9px] uppercase font-sans font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#89c07e]" /> Lead Time
              </span>
              <span className="text-sm font-black text-[#89c07e] block mt-0.5">0 Days</span>
              <span className="text-[9px] text-[#89c07e] block truncate">Same-City Hub</span>
            </div>

            {/* 2. Cost */}
            <div className="p-2 rounded-xl bg-[#2a3f3f]/60 border border-[#e0e8e2]/10">
              <span className="text-[#e0e8e2]/60 block text-[9px] uppercase font-sans font-bold flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-[#89c07e]" /> Cost
              </span>
              <span className="text-sm font-black text-white block mt-0.5">₹250</span>
              <span className="text-[9px] text-[#e0e8e2]/60 block truncate">₹15/unit transit</span>
            </div>

            {/* 3. Compliance Status */}
            <div className="p-2 rounded-xl bg-[#2a3f3f]/60 border border-[#e0e8e2]/10">
              <span className="text-[#e0e8e2]/60 block text-[9px] uppercase font-sans font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#89c07e]" /> Compliance
              </span>
              <span className="text-xs font-bold text-[#89c07e] block mt-0.5">100% Valid</span>
              <span className="text-[9px] text-[#89c07e] block truncate">Cold-Chain (Y)</span>
            </div>

            {/* 4. Risk Level */}
            <div className="p-2 rounded-xl bg-[#2a3f3f]/60 border border-[#e0e8e2]/10">
              <span className="text-[#e0e8e2]/60 block text-[9px] uppercase font-sans font-bold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-[#89c07e]" /> Risk Level
              </span>
              <span className="text-xs font-black text-[#89c07e] block mt-0.5">MINIMAL</span>
              <span className="text-[9px] text-[#89c07e] block truncate">No Inter-City Delay</span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-[#467750]/20 border border-[#89c07e]/30 text-[11px] text-[#89c07e] flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#89c07e]" />
            <span className="truncate">
              Surplus Hub H005 ({targetCity}) selected. Cross-city facility H006 (Indore) excluded.
            </span>
          </div>
        </div>

        {/* OPTION B: COMMERCIAL PROCUREMENT / LIVE SUPPLIER BIDS */}
        <div
          onClick={() => onSelectPlan(optionB)}
          className={`p-4 rounded-2xl glass-panel border cursor-pointer transition-all duration-150 relative overflow-hidden ${
            currentPlan.id === 'OPTION_B'
              ? 'border-[#f0cd6e] bg-gradient-to-br from-[#f0cd6e]/15 via-[#2c2e35]/90 to-[#2c2e35] shadow-xl ring-2 ring-[#f0cd6e]/60'
              : 'border-[#e0e8e2]/15 hover:border-[#f0cd6e]/40 bg-[#2c2e35]/60'
          }`}
        >
          {/* Card Top Pill */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5">
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2a3f3f] text-[#f0cd6e] border border-[#f0cd6e]/30">
                <Truck className="w-3 h-3" />
                <span>{matchingSupplier.isLiveBid ? 'LIVE SUPPLIER BID' : 'COMMERCIAL PROCUREMENT'}</span>
              </span>

              {liveBidsForMaterial.length > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#89c07e]/20 text-[#89c07e] border border-[#89c07e]/40 font-semibold flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-[#89c07e]" />
                  <span>{liveBidsForMaterial.length} Portal Bids</span>
                </span>
              )}
            </div>

            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                currentPlan.id === 'OPTION_B'
                  ? 'border-[#f0cd6e] bg-[#f0cd6e] text-[#2c2e35]'
                  : 'border-[#e0e8e2]/30'
              }`}
            >
              {currentPlan.id === 'OPTION_B' && <CheckCircle2 className="w-3.5 h-3.5 font-bold" />}
            </div>
          </div>

          <h3 className="text-base font-bold text-white tracking-tight">{optionB.title}</h3>
          <p className="text-xs text-[#e0e8e2]/70 mt-1 line-clamp-2">{optionB.description}</p>

          {/* Compressed 4-Parameter Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3 font-mono text-xs">
            {/* 1. Lead Time */}
            <div className="p-2 rounded-xl bg-[#2a3f3f]/60 border border-[#e0e8e2]/10">
              <span className="text-[#e0e8e2]/60 block text-[9px] uppercase font-sans font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#f0cd6e]" /> Lead Time
              </span>
              <span className="text-sm font-black text-[#f0cd6e] block mt-0.5">
                {matchingSupplier.LEAD_TIME} Days
              </span>
              <span className="text-[9px] text-[#f0cd6e] block truncate">
                {matchingSupplier.LEAD_TIME * 24}h Courier
              </span>
            </div>

            {/* 2. Cost */}
            <div className="p-2 rounded-xl bg-[#2a3f3f]/60 border border-[#e0e8e2]/10">
              <span className="text-[#e0e8e2]/60 block text-[9px] uppercase font-sans font-bold flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-[#f0cd6e]" /> Cost
              </span>
              <span className="text-sm font-black text-[#f0cd6e] block mt-0.5">
                ₹{(bufferTransferQty * matchingSupplier.UNIT_COST).toLocaleString()}
              </span>
              <span className="text-[9px] text-[#e0e8e2]/60 block truncate">
                ₹{matchingSupplier.UNIT_COST}/unit
              </span>
            </div>

            {/* 3. Compliance Status */}
            <div className="p-2 rounded-xl bg-[#2a3f3f]/60 border border-[#e0e8e2]/10">
              <span className="text-[#e0e8e2]/60 block text-[9px] uppercase font-sans font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#89c07e]" /> Compliance
              </span>
              <span
                className={`text-xs font-bold block mt-0.5 ${
                  matchingSupplier.COMPLIANCE === 'Y' ? 'text-[#89c07e]' : 'text-red-400'
                }`}
              >
                {matchingSupplier.COMPLIANCE === 'Y' ? 'Certified' : 'Flagged (N)'}
              </span>
              <span className="text-[9px] text-[#e0e8e2]/60 block truncate">
                {matchingSupplier.COMPLIANCE === 'Y' ? 'Cold-Chain (Y)' : 'Excursion'}
              </span>
            </div>

            {/* 4. Risk Level */}
            <div className="p-2 rounded-xl bg-[#2a3f3f]/60 border border-[#e0e8e2]/10">
              <span className="text-[#e0e8e2]/60 block text-[9px] uppercase font-sans font-bold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-[#f0cd6e]" /> Risk Level
              </span>
              <span
                className={`text-xs font-extrabold block mt-0.5 ${
                  matchingSupplier.COMPLIANCE === 'Y' ? 'text-[#f0cd6e]' : 'text-red-400'
                }`}
              >
                {matchingSupplier.COMPLIANCE === 'Y' ? 'MODERATE' : 'CRITICAL'}
              </span>
              <span className="text-[9px] text-[#e0e8e2]/60 block truncate">Commercial Port</span>
            </div>
          </div>

          {/* Quick Quote Selector (if live bids exist) */}
          {liveBidsForMaterial.length > 0 && (
            <div className="p-2 rounded-xl bg-[#2a3f3f]/50 border border-[#89c07e]/30 text-[11px] flex items-center justify-between">
              <span className="text-[#89c07e] font-mono font-bold flex items-center gap-1">
                <Tag className="w-3 h-3" /> Select Live Quote:
              </span>
              <div className="flex items-center space-x-1.5">
                {liveBidsForMaterial.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBidId(b.id);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                      selectedBidId === b.id
                        ? 'bg-[#f0cd6e] text-slate-950 font-black'
                        : 'bg-[#2a3f3f] text-[#e0e8e2]/80 hover:text-white'
                    }`}
                  >
                    {b.supplierId} (₹{b.unitCost})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compressed Executive Parameter Comparison Matrix Table */}
      <div className="rounded-2xl glass-panel border border-[#e0e8e2]/15 overflow-hidden bg-[#2c2e35]/80 shadow-lg">
        <div className="px-4 py-2 bg-[#2a3f3f]/50 border-b border-[#e0e8e2]/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-3.5 h-3.5 text-[#89c07e]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Recovery Scenario Comparison Matrix (4 Decision Dimensions)
            </h4>
          </div>
          <span className="text-[10px] font-mono text-[#89c07e] bg-[#2a3f3f] px-2 py-0.5 rounded-full border border-[#89c07e]/30">
            Multi-Criteria Decision Analysis
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-[#e0e8e2]/10 bg-[#2c2e35]/90 text-[#e0e8e2]/60 text-[10px] uppercase tracking-wider">
                <th className="py-2 px-4">Parameter</th>
                <th className="py-2 px-4 text-[#89c07e]">Option A: Same-City Hub H005 ({targetCity})</th>
                <th className="py-2 px-4 text-[#f0cd6e]">Option B: Commercial ({matchingSupplier.SUPPLIER_ID})</th>
                <th className="py-2 px-4 text-right">Advantage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e8e2]/10">
              {/* 1. Lead Time */}
              <tr className="hover:bg-[#2a3f3f]/30">
                <td className="py-2 px-4 font-bold text-white flex items-center space-x-2 font-sans">
                  <Clock className="w-3.5 h-3.5 text-[#89c07e]" />
                  <span>Lead Time</span>
                </td>
                <td className="py-2 px-4 text-[#89c07e] font-extrabold text-xs">
                  0 Days <span className="text-[10px] text-[#e0e8e2]/60 font-normal font-sans">(Same-City Dispatch)</span>
                </td>
                <td className="py-2 px-4 text-[#f0cd6e] font-bold">
                  {matchingSupplier.LEAD_TIME} Days <span className="text-[10px] text-[#e0e8e2]/60 font-normal font-sans">({matchingSupplier.LEAD_TIME * 24}h Courier)</span>
                </td>
                <td className="py-2 px-4 text-right">
                  <span className="px-2 py-0.5 rounded-full bg-[#467750]/30 text-[#89c07e] text-[10px] font-bold border border-[#89c07e]/30 font-sans">
                    Option A (+{matchingSupplier.LEAD_TIME}d Faster)
                  </span>
                </td>
              </tr>

              {/* 2. Cost */}
              <tr className="hover:bg-[#2a3f3f]/30">
                <td className="py-2 px-4 font-bold text-white flex items-center space-x-2 font-sans">
                  <DollarSign className="w-3.5 h-3.5 text-[#89c07e]" />
                  <span>Cost</span>
                </td>
                <td className="py-2 px-4 text-[#89c07e] font-extrabold text-xs">
                  ₹250 Total <span className="text-[10px] text-[#e0e8e2]/60 font-normal font-sans">(₹15/unit transit fee)</span>
                </td>
                <td className="py-2 px-4 text-[#f0cd6e] font-bold">
                  ₹{(bufferTransferQty * matchingSupplier.UNIT_COST).toLocaleString()} Total <span className="text-[10px] text-[#e0e8e2]/60 font-normal font-sans">(₹{matchingSupplier.UNIT_COST}/unit)</span>
                </td>
                <td className="py-2 px-4 text-right">
                  <span className="px-2 py-0.5 rounded-full bg-[#467750]/30 text-[#89c07e] text-[10px] font-bold border border-[#89c07e]/30 font-sans">
                    Option A Saves ₹{(bufferTransferQty * matchingSupplier.UNIT_COST - 250).toLocaleString()}
                  </span>
                </td>
              </tr>

              {/* 3. Compliance Status */}
              <tr className="hover:bg-[#2a3f3f]/30">
                <td className="py-2 px-4 font-bold text-white flex items-center space-x-2 font-sans">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#89c07e]" />
                  <span>Compliance Status</span>
                </td>
                <td className="py-2 px-4 text-[#89c07e] font-bold">
                  <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#467750]/30 border border-[#89c07e]/40 text-[10px]">
                    <CheckCircle2 className="w-3 h-3 text-[#89c07e]" />
                    <span>Verified Cold-Chain (Y)</span>
                  </div>
                </td>
                <td className="py-2 px-4 font-bold">
                  {matchingSupplier.COMPLIANCE === 'Y' ? (
                    <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#467750]/20 text-[#89c07e] border border-[#89c07e]/30 text-[10px]">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Cold-Chain Certified (Y)</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-500/50 text-[10px]">
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                      <span>Non-Compliant (N)</span>
                    </div>
                  )}
                </td>
                <td className="py-2 px-4 text-right">
                  <span className="px-2 py-0.5 rounded-full bg-[#467750]/30 text-[#89c07e] text-[10px] font-bold border border-[#89c07e]/30 font-sans">
                    {matchingSupplier.COMPLIANCE === 'Y' ? 'Both Verified' : 'Option A Only'}
                  </span>
                </td>
              </tr>

              {/* 4. Risk Level */}
              <tr className="hover:bg-[#2a3f3f]/30">
                <td className="py-2 px-4 font-bold text-white flex items-center space-x-2 font-sans">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#89c07e]" />
                  <span>Risk Level</span>
                </td>
                <td className="py-2 px-4 text-[#89c07e] font-extrabold">
                  <span className="px-2 py-0.5 rounded bg-[#467750]/40 text-[#89c07e] border border-[#89c07e]/40 text-[10px]">
                    MINIMAL (Same-City Pre-Cleared)
                  </span>
                </td>
                <td className="py-2 px-4">
                  <span
                    className={`px-2 py-0.5 rounded border font-bold text-[10px] ${
                      matchingSupplier.COMPLIANCE === 'Y'
                        ? 'bg-[#f0cd6e]/20 text-[#f0cd6e] border-[#f0cd6e]/30'
                        : 'bg-red-950 text-red-300 border-red-500/40'
                    }`}
                  >
                    {matchingSupplier.COMPLIANCE === 'Y'
                      ? 'MODERATE (Transit Delay)'
                      : 'CRITICAL (Excursion Risk)'}
                  </span>
                </td>
                <td className="py-2 px-4 text-right">
                  <span className="px-2 py-0.5 rounded-full bg-[#467750]/30 text-[#89c07e] text-[10px] font-bold border border-[#89c07e]/30 font-sans">
                    Option A Optimal
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Footer */}
      <div className="p-3.5 rounded-2xl glass-panel border border-[#e0e8e2]/15 bg-[#2c2e35]/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <span className="text-[11px] text-[#e0e8e2]/60">Currently Selected Strategy:</span>
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <span>{currentPlan.title}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#2a3f3f] text-[#f0cd6e] border border-[#f0cd6e]/30">
              Lead Time: {currentPlan.leadTimeDays}d • Cost: {currentPlan.costFormatted}
            </span>
          </div>
        </div>

        <button
          onClick={() => onProceedToCompliance(currentPlan)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center space-x-1.5"
        >
          <span>Confirm & Proceed to Compliance Check (Screen 4)</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
        </button>
      </div>
    </div>
  );
}
