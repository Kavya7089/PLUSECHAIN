import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { usePulseChain } from '../context/PulseChainContext';
import ExternalRiskPanel from './ExternalRiskPanel';
import CopyButton from './common/CopyButton';
import {
  Shield,
  Building2,
  Truck,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  MapPin,
  Package,
  RefreshCw,
  Search,
  UserPlus,
  Users,
  X,
  Cpu,
  Globe2,
} from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api';

export default function RegionalHeadDashboard() {
  const { user, inventory, disruptionLength, fetchInventory, register } = usePulseChain();

  const [selectedCity, setSelectedCity] = useState('ALL');
  const [activeTab, setActiveTab] = useState('INVENTORY');
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toLocaleTimeString());

  // Multi-City Data
  const [staffUsers, setStaffUsers] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [shipments, setShipments] = useState({ outgoingDispatches: [], incomingReceipts: [] });
  const [loadingShipments, setLoadingShipments] = useState(false);

  // Inline User Registration Modal State
  const [regModalOpen, setRegModalOpen] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('Pulse@2026');
  const [regFullName, setRegFullName] = useState('');
  const [regRole, setRegRole] = useState('SHOPKEEPER');
  const [regHospitalId, setRegHospitalId] = useState('H004');
  const [regSupplierId, setRegSupplierId] = useState('V1001');
  const [regCity, setRegCity] = useState('BHOPAL');
  const [regWarehouseBay, setRegWarehouseBay] = useState('COLD_CHAIN_BAY_1');
  const [regStatusMsg, setRegStatusMsg] = useState(null);
  const [regSubmitting, setRegSubmitting] = useState(false);

  const hospitalsList = [
    { id: 'H001', name: 'Metro Health Central', city: 'BHOPAL' },
    { id: 'H002', name: "St. Luke's Memorial", city: 'BHOPAL' },
    { id: 'H003', name: 'Mercy General Medical', city: 'JABALPUR' },
    { id: 'H004', name: 'Bhopal Apex Care Hospital', city: 'BHOPAL' },
    { id: 'H005', name: 'Central Surplus Logistics Hub', city: 'BHOPAL' },
    { id: 'H006', name: 'Valley Memorial Healthcare', city: 'INDORE' },
  ];

  // Fetch Staff Users from SAP UserSet
  const fetchStaff = async () => {
    setLoadingStaff(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/regional/users`);
      if (res.data?.success) {
        setStaffUsers(res.data.users || res.data.data || []);
      }
    } catch (err) {
      console.warn('Failed to load staff directory:', err.message);
    } finally {
      setLoadingStaff(false);
    }
  };

  // Fetch Suppliers
  const fetchSupplierMaster = async () => {
    setLoadingSuppliers(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/suppliers`);
      if (res.data?.success) {
        setSuppliers(res.data.data || []);
      }
    } catch (err) {
      console.warn('Failed to load suppliers:', err.message);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  // Fetch All Regional Approvals & Dispatches
  const fetchRegionalShipments = async () => {
    setLoadingShipments(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/regional/shipments`);
      if (res.data?.success) {
        setShipments(res.data.data || { outgoingDispatches: [], incomingReceipts: [] });
      }
    } catch (err) {
      console.warn('Failed to load regional shipments:', err.message);
    } finally {
      setLoadingShipments(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchSupplierMaster();
    fetchRegionalShipments();
  }, []);

  const handleRefreshAll = async () => {
    await Promise.all([
      fetchInventory(),
      fetchStaff(),
      fetchSupplierMaster(),
      fetchRegionalShipments(),
    ]);
    setLastUpdated(new Date().toLocaleTimeString());
  };

  // City-Filtered Inventory
  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    if (selectedCity === 'ALL') return inventory;
    return inventory.filter((item) => (item.CITY || 'BHOPAL').toUpperCase() === selectedCity.toUpperCase());
  }, [inventory, selectedCity]);

  // Aggregate Metrics Across Corridor
  const totalStockUnits = useMemo(() => {
    return (inventory || []).reduce((acc, cur) => acc + (cur.CURRENT_STOCK || 0), 0);
  }, [inventory]);

  const totalDeficits = useMemo(() => {
    return (inventory || []).filter((item) => item.daysCover < (disruptionLength || 12)).length;
  }, [inventory, disruptionLength]);

  const totalActiveShipments = useMemo(() => {
    const outCount = (shipments.outgoingDispatches || []).filter((s) => s.status === 'PENDING_APPROVAL').length;
    const inCount = (shipments.incomingReceipts || []).filter((s) => s.status === 'DISPATCHED_IN_TRANSIT').length;
    return outCount + inCount;
  }, [shipments]);

  // City Breakdown Cards
  const cityMetrics = useMemo(() => {
    const cities = ['BHOPAL', 'INDORE', 'JABALPUR'];
    return cities.map((city) => {
      const items = (inventory || []).filter((i) => (i.CITY || 'BHOPAL').toUpperCase() === city);
      const units = items.reduce((acc, i) => acc + (i.CURRENT_STOCK || 0), 0);
      const critical = items.filter((i) => i.daysCover < (disruptionLength || 12)).length;
      return { city, totalUnits: units, criticalCount: critical, totalItems: items.length };
    });
  }, [inventory, disruptionLength]);

  // Handle Inline User Registration
  const handleRegisterUser = async (e) => {
    e.preventDefault();
    setRegSubmitting(true);
    setRegStatusMsg(null);

    const result = await register(regEmail, regPassword, {
      full_name: regFullName,
      role: regRole,
      hospital_id: regRole === 'SUPPLIER' || regRole === 'REGIONAL_ADMIN' ? null : regHospitalId,
      supplier_id: regRole === 'SUPPLIER' ? regSupplierId : null,
      city: regRole === 'REGIONAL_ADMIN' ? 'ALL' : regCity,
      region_name: 'MP_CENTRAL_WEST',
      warehouse_bay: regRole === 'SHOPKEEPER' ? regWarehouseBay : null,
    });

    if (result.success) {
      setRegStatusMsg({
        type: 'success',
        text: `Staff user created in Supabase & committed live into SAP ZPULSE_USERS.`,
      });
      fetchStaff();
      setTimeout(() => {
        setRegModalOpen(false);
        setRegStatusMsg(null);
        setRegFullName('');
        setRegEmail('');
      }, 2000);
    } else {
      setRegStatusMsg({
        type: 'error',
        text: result.message || 'Registration failed.',
      });
    }
    setRegSubmitting(false);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto text-abyss-text font-sans">
      {/* Top Bento Header: Regional Authority Header */}
      <div className="rounded-xl bg-abyss-card border border-sand-border p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-abyss-elevated border border-sand-border flex items-center justify-center p-1.5 shadow-sm shrink-0">
              <img
                src="/pulsechain-logo.png"
                alt="PulseChain Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-black text-abyss-text tracking-tight">
                  Team Techy's • MP Regional Health Authority
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-volt text-volt-text">
                  REGIONAL OVERSIGHT
                </span>
              </div>
              <p className="text-xs text-abyss-muted font-mono mt-0.5">
                Corridor: <strong className="text-abyss-text">BHOPAL • INDORE • JABALPUR</strong> • Administrator:{' '}
                <strong className="text-volt">{user?.name || user?.full_name || "Team Techy's"}</strong> • Contact:{' '}
                <a href="mailto:kavya.0111cd231058@technocratsgrou.com" className="text-volt hover:underline">kavya.0111cd231058@technocratsgrou.com</a> •{' '}
                <a href="tel:+919691475225" className="text-volt hover:underline">+91 96914 75225</a>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start md:self-center">
            <button
              type="button"
              onClick={() => setRegModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-volt text-volt-text hover:bg-volt-hover transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-[#FFD400]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Staff (SAP)</span>
            </button>
            <button
              type="button"
              onClick={handleRefreshAll}
              className="p-2 rounded-xl text-xs font-mono bg-abyss-elevated border border-sand-border text-abyss-text hover:border-volt transition-colors"
              title="Refresh All Multi-City Data"
            >
              <RefreshCw className="w-4 h-4 text-volt" />
            </button>
          </div>
        </div>

        {/* Multi-City 4 KPI Overview Bento Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-abyss-elevated border border-sand-border space-y-1">
            <span className="text-abyss-muted block text-[10px] uppercase">Total Regional Inventory</span>
            <span className="text-xl font-black text-abyss-text block">
              {totalStockUnits.toLocaleString()} <span className="text-xs font-normal text-abyss-muted">Units</span>
            </span>
            <span className="text-[10px] text-volt block">Live in SAP ZPULSE_INV</span>
          </div>

          <div className="p-3.5 rounded-xl bg-abyss-elevated border border-sand-border space-y-1">
            <span className="text-abyss-muted block text-[10px] uppercase">Critical Deficits (&lt;5d)</span>
            <span className="text-xl font-black text-volt block">
              {totalDeficits} <span className="text-xs font-normal text-abyss-muted">Materials</span>
            </span>
            <span className="text-[10px] text-volt block">Immediate Buffer Offset Req</span>
          </div>

          <div className="p-3.5 rounded-xl bg-abyss-elevated border border-sand-border space-y-1">
            <span className="text-abyss-muted block text-[10px] uppercase">Active Approvals</span>
            <span className="text-xl font-black text-abyss-text block">
              {totalActiveShipments} <span className="text-xs font-normal text-abyss-muted">Orders</span>
            </span>
            <span className="text-[10px] text-abyss-muted block">2-Step Goods Movement</span>
          </div>

          <div className="p-3.5 rounded-xl bg-abyss-elevated border border-sand-border space-y-1">
            <span className="text-abyss-muted block text-[10px] uppercase">ERP Staff Directory</span>
            <span className="text-xl font-black text-abyss-text block">
              {staffUsers.length} <span className="text-xs font-normal text-abyss-muted">Staff</span>
            </span>
            <span className="text-[10px] text-abyss-muted block">SAP ZPULSE_USERS (UserSet)</span>
          </div>
        </div>
      </div>

      {/* City Breakdown Quick Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
        {cityMetrics.map((cm) => (
          <div
            key={cm.city}
            onClick={() => setSelectedCity(cm.city)}
            className={`p-3.5 rounded-xl border cursor-pointer transition-colors ${
              selectedCity === cm.city
                ? 'bg-abyss-elevated border-volt shadow-sm'
                : 'bg-abyss-card border-sand-border hover:border-abyss-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-abyss-text flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-volt" />
                <span>{cm.city} Hub</span>
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  cm.criticalCount > 0 ? 'bg-volt text-volt-text' : 'bg-sand-base text-sand-text'
                }`}
              >
                {cm.criticalCount > 0 ? `${cm.criticalCount} Deficits` : 'Safe'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-abyss-muted">
              <span>Stock: <strong className="text-abyss-text">{cm.totalUnits.toLocaleString()} units</strong></span>
              <span>Monitored: <strong className="text-abyss-text">{cm.totalItems} records</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Navigation & City Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-border pb-3">
        <div className="flex items-center flex-wrap gap-2">
          {[
            { id: 'INVENTORY', label: 'Multi-City Inventory Health', icon: Package },
            { id: 'SHIPMENTS', label: 'Regional Approvals & Dispatches', icon: Truck },
            { id: 'RISK', label: 'External Risk Radar', icon: Globe2 },
            { id: 'SUPPLIERS', label: 'SAP Supplier Leaderboard', icon: Cpu },
            { id: 'STAFF', label: 'Enterprise Staff Directory', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors focus-visible:ring-2 focus-visible:ring-[#FFD400] ${
                  isActive
                    ? 'bg-volt text-volt-text shadow-sm'
                    : 'bg-abyss-card text-abyss-muted hover:text-abyss-text border border-sand-border'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* City Filter Pills & Last Updated */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-abyss-muted hidden sm:inline">
            Last updated: {lastUpdated}
          </span>
          <div className="flex items-center space-x-1 bg-abyss-card p-1 rounded-lg border border-sand-border text-xs font-mono">
            <span className="text-[10px] text-abyss-muted px-1.5 font-bold uppercase">City:</span>
            {['ALL', 'BHOPAL', 'INDORE', 'JABALPUR'].map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setSelectedCity(city)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  selectedCity === city
                    ? 'bg-volt text-volt-text font-black'
                    : 'text-abyss-muted hover:text-abyss-text'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MULTI-CITY INVENTORY HEALTH                                        */}
      {/* ========================================================================= */}
      {activeTab === 'INVENTORY' && (
        <div className="rounded-xl bg-abyss-card border border-sand-border p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-sand-border pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-abyss-text font-mono flex items-center gap-2">
              <Package className="w-4 h-4 text-volt" />
              <span>SAP S/4HANA Multi-City Inventory Ledger ({selectedCity})</span>
            </h3>
            <span className="text-xs font-mono text-volt font-bold">
              {filteredInventory.length} Active Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-sand-border text-[10px] text-abyss-muted uppercase tracking-wider bg-abyss-elevated">
                  <th className="py-2.5 px-3">Hospital</th>
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 px-3">Material ID</th>
                  <th className="py-2.5 px-3 text-right">Physical Stock</th>
                  <th className="py-2.5 px-3 text-right">Daily Burn</th>
                  <th className="py-2.5 px-3 text-center">Days Cover</th>
                  <th className="py-2.5 px-3 text-center">Resilience Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-border">
                {filteredInventory.map((item, idx) => {
                  const isCrit = item.daysCover < (disruptionLength || 12);
                  return (
                    <tr key={`${item.HOSPITAL_ID}-${item.MATERIAL_ID}-${idx}`} className="hover:bg-abyss-elevated transition-colors">
                      <td className="py-2.5 px-3 font-bold text-abyss-text flex items-center gap-1.5">
                        <span>{item.HOSPITAL_ID}</span>
                        <CopyButton text={item.HOSPITAL_ID} label="Copy Hospital ID" />
                      </td>
                      <td className="py-2.5 px-3 text-abyss-muted">{item.CITY || 'BHOPAL'}</td>
                      <td className="py-2.5 px-3 text-volt font-bold">
                        <div className="flex items-center gap-1.5">
                          <span>{item.MATERIAL_ID}</span>
                          <CopyButton text={item.MATERIAL_ID} label="Copy Material ID" />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-abyss-text font-bold">
                        {item.CURRENT_STOCK} {item.UNIT || 'EA'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-abyss-muted">
                        {item.DAILY_USE} {item.UNIT || 'EA'}/day
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        <span className={isCrit ? 'text-volt font-extrabold' : 'text-abyss-text'}>
                          {item.daysCover}d
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCrit
                              ? 'bg-volt text-volt-text font-black'
                              : 'bg-sand-base text-sand-text'
                          }`}
                        >
                          {isCrit ? 'CRITICAL DEFICIT' : 'OPTIMAL COVERAGE'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REGIONAL 2-STEP SHIPMENT APPROVALS                                 */}
      {/* ========================================================================= */}
      {activeTab === 'SHIPMENTS' && (
        <div className="rounded-xl bg-abyss-card border border-sand-border p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-sand-border pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-abyss-text font-mono flex items-center gap-2">
              <Truck className="w-4 h-4 text-volt" />
              <span>Corridor Goods Movement Approvals (2-Step ERP Chain of Custody)</span>
            </h3>
            <span className="text-xs font-mono text-abyss-muted">
              Live tracking against SAP ZPULSE_INV
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Dispatches */}
            <div className="rounded-xl bg-abyss-elevated border border-sand-border p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase text-volt font-mono flex items-center justify-between">
                <span>1. Outgoing Physical Dispatches</span>
                <span className="text-[10px] bg-abyss-card px-2 py-0.5 rounded text-abyss-text">
                  {shipments.outgoingDispatches?.length || 0} Orders
                </span>
              </h4>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {(shipments.outgoingDispatches || []).map((s) => (
                  <div key={s.id} className="p-3 rounded-lg bg-abyss-card border border-sand-border text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-abyss-text">
                        <span>{s.id}</span>
                        <CopyButton text={s.id} label="Copy Shipment ID" />
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-sand-base text-sand-text font-bold">
                        {s.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-abyss-muted">
                      Route: {s.source_hospital_id} ➔ {s.dest_hospital_id} | Qty: <strong className="text-volt">{s.quantity} units</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Receipts */}
            <div className="rounded-xl bg-abyss-elevated border border-sand-border p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase text-volt font-mono flex items-center justify-between">
                <span>2. Incoming Goods Receipts</span>
                <span className="text-[10px] bg-abyss-card px-2 py-0.5 rounded text-abyss-text">
                  {shipments.incomingReceipts?.length || 0} Orders
                </span>
              </h4>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {(shipments.incomingReceipts || []).map((s) => (
                  <div key={s.id} className="p-3 rounded-lg bg-abyss-card border border-sand-border text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-abyss-text">
                        <span>{s.id}</span>
                        <CopyButton text={s.id} label="Copy Shipment ID" />
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-sand-base text-sand-text font-bold">
                        {s.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-abyss-muted">
                      Receiving: {s.dest_hospital_id} | Material: {s.material_id} | Qty: <strong className="text-volt">{s.quantity} units</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EXTERNAL RISK RADAR                                                */}
      {/* ========================================================================= */}
      {activeTab === 'RISK' && (
        <div className="space-y-4">
          <ExternalRiskPanel hospitalId={selectedCity === 'ALL' ? 'H004' : selectedCity === 'INDORE' ? 'H006' : 'H004'} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SAP SUPPLIER LEADERBOARD                                           */}
      {/* ========================================================================= */}
      {activeTab === 'SUPPLIERS' && (
        <div className="rounded-xl bg-abyss-card border border-sand-border p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-sand-border pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-abyss-text font-mono flex items-center gap-2">
                <Cpu className="w-4 h-4 text-volt" />
                <span>SAP S/4HANA Supplier Trust Score Leaderboard (Zero Client Math)</span>
              </h3>
              <p className="text-xs text-abyss-muted font-mono mt-0.5">
                8-Factor Trust Score natively calculated in SAP HANA core table ZPULSE_SUPP
              </p>
            </div>
            <span className="text-xs font-mono text-abyss-muted">
              Last updated: {lastUpdated}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {suppliers.map((sup) => (
              <div
                key={`${sup.SUPPLIER_ID}-${sup.MATERIAL_ID}`}
                className="p-4 rounded-xl bg-abyss-elevated border border-sand-border space-y-3 font-mono text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-abyss-text text-sm">
                    <span>{sup.SUPPLIER_ID}</span>
                    <CopyButton text={sup.SUPPLIER_ID} label="Copy Supplier ID" />
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      sup.SUPPLIER_TIER === 'PLATINUM'
                        ? 'bg-volt text-volt-text font-black'
                        : sup.SUPPLIER_TIER === 'GOLD'
                        ? 'bg-sand-base text-sand-text font-bold'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {sup.SUPPLIER_TIER} TIER
                  </span>
                </div>

                <div className="text-[11px] text-abyss-muted">
                  Material: <strong className="text-abyss-text">{sup.MATERIAL_ID}</strong> • Rate: <strong className="text-volt">₹{sup.UNIT_COST}</strong>
                </div>

                <div className="p-3 rounded-lg bg-abyss-card border border-sand-border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-abyss-muted text-[10px]">HANA Trust Score:</span>
                    <strong className="text-base font-black text-volt">{sup.TRUST_SCORE} / 100</strong>
                  </div>
                  <div className="w-full h-1.5 bg-abyss-canvas rounded-full overflow-hidden">
                    <div
                      className="h-full bg-volt rounded-full"
                      style={{ width: `${Math.min(100, sup.TRUST_SCORE || 0)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-abyss-muted">
                  <div>Delivery Speed: <strong className="text-abyss-text">{sup.DELIVERY_SPEED ?? 90}</strong></div>
                  <div>On-Time: <strong className="text-abyss-text">{sup.ON_TIME_RATE ?? 90}</strong></div>
                  <div>Quality: <strong className="text-abyss-text">{sup.QUALITY_SCORE ?? 95}</strong></div>
                  <div>Cold-Chain: <strong className="text-abyss-text">{sup.COLD_CHAIN_SCORE ?? 95}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: STAFF & USER DIRECTORY                                             */}
      {/* ========================================================================= */}
      {activeTab === 'STAFF' && (
        <div className="rounded-xl bg-abyss-card border border-sand-border p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-sand-border pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-abyss-text font-mono flex items-center gap-2">
                <Users className="w-4 h-4 text-volt" />
                <span>Enterprise Staff Directory (SAP ZPULSE_USERS / UserSet)</span>
              </h3>
              <p className="text-xs text-abyss-muted font-mono mt-0.5">
                Staff registered live across Supabase Auth and SAP S/4HANA OData Gateway
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRegModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-volt text-volt-text hover:bg-volt-hover transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#FFD400]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Staff</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-sand-border text-[10px] text-abyss-muted uppercase tracking-wider bg-abyss-elevated">
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Facility / Bay</th>
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 px-3 text-center">SAP Synced</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-border">
                {staffUsers.map((u) => (
                  <tr key={u.UserId || u.Email} className="hover:bg-abyss-elevated transition-colors">
                    <td className="py-2.5 px-3 font-bold text-abyss-text">{u.FullName || 'Staff User'}</td>
                    <td className="py-2.5 px-3 text-abyss-muted">
                      <div className="flex items-center gap-1.5">
                        <span>{u.Email}</span>
                        <CopyButton text={u.Email} label="Copy Email" />
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-abyss-elevated text-volt border border-sand-border">
                        {u.Role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-abyss-text">
                      {u.HospitalId || u.SupplierId || 'REGIONAL HQ'}
                      {u.WarehouseBay ? ` (${u.WarehouseBay})` : ''}
                    </td>
                    <td className="py-2.5 px-3 text-abyss-muted">{u.City || 'BHOPAL'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] text-volt font-bold">YES (LIVE)</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INLINE USER REGISTRATION MODAL (DUAL-SYNC SUPABASE + SAP)                 */}
      {/* ========================================================================= */}
      {regModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Register Enterprise Staff Member"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-lg rounded-xl p-6 bg-abyss-card border border-sand-border shadow-2xl space-y-4 text-abyss-text font-sans">
            <div className="flex items-start justify-between border-b border-sand-border pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-volt block">
                  Dual-Sync Provisioning
                </span>
                <h3 className="text-lg font-bold text-abyss-text tracking-tight mt-0.5">
                  Register Enterprise Staff Member
                </h3>
                <p className="text-xs text-abyss-muted font-mono mt-0.5">
                  Creates credentials in Supabase Auth and registers staff live into SAP S/4HANA UserSet.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRegModalOpen(false);
                  setRegStatusMsg(null);
                }}
                className="p-1.5 rounded-lg text-abyss-muted hover:text-abyss-text hover:bg-abyss-elevated focus-visible:ring-2 focus-visible:ring-[#FFD400]"
                aria-label="Close registration modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {regStatusMsg && (
              <div
                className={`p-3 rounded-lg border text-xs font-mono flex items-center gap-2 ${
                  regStatusMsg.type === 'success'
                    ? 'bg-sand-base text-sand-text border-sand-border'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                {regStatusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-abyss-canvas shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{regStatusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleRegisterUser} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-[11px] text-abyss-muted mb-1 font-bold">Full Name</label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Sharma"
                  className="w-full px-3 py-2 rounded-lg bg-abyss-elevated border border-sand-border text-abyss-text focus:outline-none focus:border-volt"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-abyss-muted mb-1 font-bold">Email</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="user@pulsechain.org"
                    className="w-full px-3 py-2 rounded-lg bg-abyss-elevated border border-sand-border text-abyss-text focus:outline-none focus:border-volt"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-abyss-muted mb-1 font-bold">Password</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-abyss-elevated border border-sand-border text-abyss-text focus:outline-none focus:border-volt"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-abyss-muted mb-1 font-bold">Role</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-abyss-elevated border border-sand-border text-abyss-text focus:outline-none focus:border-volt"
                  >
                    <option value="HOSPITAL_MANAGER">HOSPITAL_MANAGER</option>
                    <option value="SHOPKEEPER">SHOPKEEPER</option>
                    <option value="SUPPLIER">SUPPLIER</option>
                    <option value="REGIONAL_ADMIN">REGIONAL_ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-abyss-muted mb-1 font-bold">Facility</label>
                  <select
                    value={regHospitalId}
                    onChange={(e) => {
                      const hId = e.target.value;
                      setRegHospitalId(hId);
                      const match = hospitalsList.find((h) => h.id === hId);
                      if (match) setRegCity(match.city);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-abyss-elevated border border-sand-border text-abyss-text focus:outline-none focus:border-volt"
                  >
                    {hospitalsList.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.id} — {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-sand-border">
                <button
                  type="button"
                  onClick={() => setRegModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-abyss-elevated border border-sand-border text-abyss-text hover:bg-sand-border/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regSubmitting}
                  className="px-5 py-2 rounded-lg font-bold text-xs bg-volt text-volt-text hover:bg-volt-hover shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#FFD400]"
                >
                  {regSubmitting ? 'Syncing SAP...' : 'Register & Sync SAP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
