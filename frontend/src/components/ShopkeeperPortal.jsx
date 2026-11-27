import React, { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios';
import { usePulseChain } from '../context/PulseChainContext';
import CopyButton from './common/CopyButton';
import ConfirmModal from './common/ConfirmModal';
import {
  Building2,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  RefreshCw,
  Mail,
  ClipboardList,
  Truck,
  Inbox,
  CheckCheck,
  XCircle,
  Activity,
} from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api';

export default function ShopkeeperPortal() {
  const { user, inventory, fetchInventory } = usePulseChain();

  const assignedHospitalId = user?.hospitalId || user?.hospital_id || 'H004';
  const assignedCity = user?.city || 'BHOPAL';

  // 3 Strict Tabs: 'RECEIPTS' (Tab 1), 'DISPATCH' (Tab 2), 'AUDIT' (Tab 3)
  const [activeTab, setActiveTab] = useState('RECEIPTS');
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toLocaleTimeString());

  // Filter inventory strictly for assigned facility
  const facilityInventory = useMemo(() => {
    return (inventory || []).filter((item) => item.HOSPITAL_ID === assignedHospitalId);
  }, [inventory, assignedHospitalId]);

  // Form state for Physical Stock Count
  const [selectedMaterial, setSelectedMaterial] = useState('AMX002');
  const [stockQty, setStockQty] = useState(110);
  const [dailyUse, setDailyUse] = useState(45);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [recentAudits, setRecentAudits] = useState([]);

  // Shipment Approvals State
  const [outgoingDispatches, setOutgoingDispatches] = useState([]);
  const [incomingReceipts, setIncomingReceipts] = useState([]);
  const [loadingShipments, setLoadingShipments] = useState(false);
  const [shipmentActionId, setShipmentActionId] = useState(null);
  const [shipmentFeedback, setShipmentFeedback] = useState(null);
  const [committedReceiptIds, setCommittedReceiptIds] = useState(new Set());

  // Accessible ConfirmModal State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: '',
    isDestructive: false,
    onConfirm: () => {},
  });

  // Calculate live days of cover as user types
  const liveDaysCover = useMemo(() => {
    const s = parseFloat(stockQty);
    const d = parseFloat(dailyUse);
    if (isNaN(s) || isNaN(d) || d <= 0) return 0;
    return Math.floor(s / d);
  }, [stockQty, dailyUse]);

  const isCriticalDeficit = liveDaysCover < 5;

  // Fetch pending shipments (2-Step Approvals)
  const fetchPendingShipments = useCallback(async () => {
    setLoadingShipments(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/shipments/pending`);
      if (res.data?.success) {
        setOutgoingDispatches(res.data.outgoingDispatches || []);
        setIncomingReceipts(res.data.incomingReceipts || []);
      }
    } catch (err) {
      console.warn('[Verification Officer] Pending shipments fetch note:', err.message);
    } finally {
      setLoadingShipments(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingShipments();
  }, [fetchPendingShipments]);

  // Handle selecting an item from the table
  const handleSelectItem = (item) => {
    setSelectedMaterial(item.MATERIAL_ID);
    setStockQty(item.STOCK_QTY);
    setDailyUse(item.DAILY_USE);
    setSubmitResult(null);
  };

  // Submit physical count to SAP
  const handleSubmitCount = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/stock-count`, {
        hospitalId: assignedHospitalId,
        materialId: selectedMaterial,
        stockQty: parseFloat(stockQty),
        dailyUse: parseFloat(dailyUse),
      });

      if (response.data.success) {
        setSubmitResult({
          type: 'success',
          message: response.data.message,
          data: response.data.data,
          sapRecorded: response.data.sapRecorded,
        });

        setRecentAudits((prev) => [
          {
            id: response.data.data.auditLogId || `CNT-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            materialId: selectedMaterial,
            stockQty: parseFloat(stockQty),
            dailyUse: parseFloat(dailyUse),
            daysCover: liveDaysCover,
            alertTriggered: response.data.data.shortageAlertTriggered,
          },
          ...prev,
        ]);

        await fetchInventory();
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      setSubmitResult({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit stock count to SAP',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Step 1: Approve Outgoing Dispatch
  const executeApproveDispatch = async (shipmentId) => {
    setShipmentActionId(shipmentId);
    setShipmentFeedback(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/shipments/${shipmentId}/approve-dispatch`);
      if (res.data?.success) {
        setShipmentFeedback({
          type: 'success',
          message: res.data.message || 'Dispatch approved & stock deducted live in SAP S/4HANA!',
        });
        await fetchPendingShipments();
        await fetchInventory();
      }
    } catch (err) {
      setShipmentFeedback({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.message || 'Dispatch approval failed.',
      });
    } finally {
      setShipmentActionId(null);
    }
  };

  const handleApproveDispatch = (shipment) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Authorize Outgoing Dispatch (-SAP)',
      message: `Confirm physical dispatch of order ${shipment.id} (${shipment.qty} units of ${shipment.material_id}) to ${shipment.dest_hospital_id}? This will immediately deduct inventory in SAP S/4HANA ZPULSE_INV.`,
      confirmLabel: 'Approve & Deduct SAP Stock',
      isDestructive: false,
      onConfirm: () => executeApproveDispatch(shipment.id),
    });
  };

  // Step 1 (Alternative): Reject Outgoing Dispatch
  const executeRejectDispatch = async (shipmentId) => {
    setShipmentActionId(shipmentId);
    setShipmentFeedback(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/shipments/${shipmentId}/reject`, {
        rejection_note: 'Physical inspection failed or inventory discrepancy reported by verification officer.',
      });
      if (res.data?.success) {
        setShipmentFeedback({
          type: 'info',
          message: 'Dispatch shipment rejected before stock deduction.',
        });
        await fetchPendingShipments();
      }
    } catch (err) {
      setShipmentFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Rejection failed.',
      });
    } finally {
      setShipmentActionId(null);
    }
  };

  const handleRejectDispatch = (shipment) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reject Outgoing Dispatch',
      message: `Are you sure you want to reject shipment ${shipment.id}? This will cancel the goods movement order before any SAP stock deduction occurs.`,
      confirmLabel: 'Reject Shipment',
      isDestructive: true,
      onConfirm: () => executeRejectDispatch(shipment.id),
    });
  };

  // Step 2: Approve Incoming Goods Receipt
  const executeApproveReceipt = async (shipmentId) => {
    setShipmentActionId(shipmentId);
    setShipmentFeedback(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/shipments/${shipmentId}/approve-receipt`);
      if (res.data?.success) {
        setCommittedReceiptIds((prev) => new Set([...prev, shipmentId]));
        setShipmentFeedback({
          type: 'success',
          message: res.data.message || 'Goods received and added live into SAP ERP inventory!',
        });
        await fetchPendingShipments();
        await fetchInventory();
      }
    } catch (err) {
      setShipmentFeedback({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.message || 'Receipt approval failed.',
      });
    } finally {
      setShipmentActionId(null);
    }
  };

  const handleApproveReceipt = (shipment) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Confirm Goods Receipt (+SAP)',
      message: `Confirm physical receipt and cold-chain inspection of shipment ${shipment.id} (${shipment.qty} units of ${shipment.material_id})? This will immediately add inventory to ${assignedHospitalId} in SAP S/4HANA ZPULSE_INV.`,
      confirmLabel: 'Approve & Add SAP Stock',
      isDestructive: false,
      onConfirm: () => executeApproveReceipt(shipment.id),
    });
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto text-abyss-text font-sans">
      {/* Top Bento Header: Facility Identity & 3-Tab Navigation */}
      <div className="rounded-xl bg-abyss-card border border-sand-border p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-xl bg-abyss-elevated border border-sand-border text-volt">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-black text-abyss-text tracking-tight">
                  Verification & Cold-Chain Control Portal
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-volt text-volt-text">
                  SAP S/4HANA GATEWAY
                </span>
              </div>
              <p className="text-xs text-abyss-muted font-mono mt-0.5">
                Facility: <strong className="text-abyss-text">{assignedHospitalId}</strong> • City:{' '}
                <strong className="text-volt">{assignedCity}</strong> • Officer:{' '}
                <strong className="text-abyss-text">{user?.name}</strong> • Role:{' '}
                <strong className="text-volt">Cold-Chain & Stock Verification Officer</strong> • Bay:{' '}
                <strong className="text-abyss-text">{user?.warehouseBay || 'COLD_CHAIN_BAY_1'}</strong>
              </p>
            </div>
          </div>

          {/* Exact 3 Tabs Ordered per Specification */}
          <div className="flex items-center flex-wrap gap-2 self-start md:self-center">
            {/* Tab 1: Incoming Goods Receipt (+SAP Stock) */}
            <button
              type="button"
              onClick={() => setActiveTab('RECEIPTS')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors focus-visible:ring-2 focus-visible:ring-[#FFD400] ${
                activeTab === 'RECEIPTS'
                  ? 'bg-volt text-volt-text shadow-sm'
                  : 'bg-abyss-elevated text-abyss-muted hover:text-abyss-text border border-sand-border'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Incoming Goods Receipt (+SAP)</span>
              {incomingReceipts.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] font-black bg-[#081F20] text-volt">
                  {incomingReceipts.length}
                </span>
              )}
            </button>

            {/* Tab 2: Outgoing Dispatch Approvals (-SAP Stock) */}
            <button
              type="button"
              onClick={() => setActiveTab('DISPATCH')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors focus-visible:ring-2 focus-visible:ring-[#FFD400] ${
                activeTab === 'DISPATCH'
                  ? 'bg-volt text-volt-text shadow-sm'
                  : 'bg-abyss-elevated text-abyss-muted hover:text-abyss-text border border-sand-border'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Outgoing Dispatches (-SAP)</span>
              {outgoingDispatches.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] font-black bg-[#081F20] text-volt">
                  {outgoingDispatches.length}
                </span>
              )}
            </button>

            {/* Tab 3: Physical Stock Count Ledger */}
            <button
              type="button"
              onClick={() => setActiveTab('AUDIT')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors focus-visible:ring-2 focus-visible:ring-[#FFD400] ${
                activeTab === 'AUDIT'
                  ? 'bg-volt text-volt-text shadow-sm'
                  : 'bg-abyss-elevated text-abyss-muted hover:text-abyss-text border border-sand-border'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Stock Count Ledger</span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => {
                fetchInventory();
                fetchPendingShipments();
                setLastUpdated(new Date().toLocaleTimeString());
              }}
              className="p-2 rounded-lg text-xs font-mono bg-abyss-elevated border border-sand-border text-abyss-text hover:border-volt transition-colors"
              title="Refresh All Data"
            >
              <RefreshCw className={`w-4 h-4 text-volt ${loadingShipments ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Feedback Toast for Shipment Actions */}
      {shipmentFeedback && (
        <div className="p-3.5 rounded-xl border border-sand-border bg-abyss-card flex items-center justify-between text-xs font-mono shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-volt shrink-0" />
            <span className="text-abyss-text">{shipmentFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setShipmentFeedback(null)}
            className="text-[10px] uppercase font-bold text-abyss-muted hover:text-abyss-text"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: INCOMING GOODS RECEIPT (+SAP STOCK COMMITTED)                       */}
      {/* ========================================================================= */}
      {activeTab === 'RECEIPTS' && (
        <div className="rounded-xl bg-abyss-card border border-sand-border p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-sand-border pb-3 gap-2">
            <div className="flex items-center space-x-2">
              <Inbox className="w-5 h-5 text-volt" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-abyss-text">
                  Tab 1: Incoming Goods Receipt (+SAP Stock)
                </h3>
                <p className="text-[11px] text-abyss-muted font-mono">
                  Shipments destined for {assignedHospitalId}. Authorizing receipt adds stock live into SAP ZPULSE_INV.
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-volt text-volt-text self-start sm:self-auto">
              {incomingReceipts.length} Inbound Shipments Pending
            </span>
          </div>

          {incomingReceipts.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-abyss-muted border border-dashed border-sand-border rounded-xl space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-abyss-elevated flex items-center justify-center text-volt">
                <CheckCheck className="w-5 h-5" />
              </div>
              <div className="font-bold text-abyss-text">No incoming shipments currently awaiting receipt for facility {assignedHospitalId}.</div>
              <p className="text-[10px] text-abyss-muted">
                Supplier deliveries and peer hospital transfers will appear here once dispatched.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incomingReceipts.map((shipment) => {
                const isCommitted = committedReceiptIds.has(shipment.id);
                return (
                  <div
                    key={shipment.id}
                    className="p-4 rounded-xl bg-abyss-elevated border border-sand-border space-y-3 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-abyss-text">
                        <span>{shipment.id}</span>
                        <CopyButton text={shipment.id} label="Copy Shipment ID" />
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-sand-base text-sand-text font-bold">
                        {shipment.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-abyss-muted block text-[9px] uppercase">Material</span>
                        <div className="flex items-center gap-1">
                          <strong className="text-volt">{shipment.material_id}</strong>
                          <CopyButton text={shipment.material_id} label="Copy Material ID" />
                        </div>
                      </div>
                      <div>
                        <span className="text-abyss-muted block text-[9px] uppercase">Quantity</span>
                        <strong className="text-abyss-text">{shipment.qty} Units</strong>
                      </div>
                      <div>
                        <span className="text-abyss-muted block text-[9px] uppercase">Origin</span>
                        <strong className="text-abyss-text">{shipment.source_facility || shipment.source_hospital_id || 'SUPPLIER'}</strong>
                      </div>
                      <div>
                        <span className="text-abyss-muted block text-[9px] uppercase">Order Type</span>
                        <strong className="text-abyss-text">{shipment.order_type}</strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-sand-border">
                      {isCommitted ? (
                        <div className="py-2 px-3 rounded-lg bg-sand-base text-sand-text font-bold text-xs text-center">
                          SAP ZPULSE_INV +QTY COMMITTED
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApproveReceipt(shipment)}
                          disabled={shipmentActionId === shipment.id}
                          className="w-full py-2.5 px-4 rounded-xl bg-volt text-volt-text font-bold text-xs shadow-sm hover:bg-volt-hover active:scale-[0.99] transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#FFD400]"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>
                            {shipmentActionId === shipment.id
                              ? 'Committing to SAP S/4HANA...'
                              : 'Approve Goods Receipt & Increase SAP Stock'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: OUTGOING DISPATCH APPROVALS (-SAP STOCK COMMITTED)                 */}
      {/* ========================================================================= */}
      {activeTab === 'DISPATCH' && (
        <div className="rounded-xl bg-abyss-card border border-sand-border p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-sand-border pb-3 gap-2">
            <div className="flex items-center space-x-2">
              <Truck className="w-5 h-5 text-volt" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-abyss-text">
                  Tab 2: Outgoing Dispatch Approvals (-SAP Stock)
                </h3>
                <p className="text-[11px] text-abyss-muted font-mono">
                  Reallocations originating from {assignedHospitalId}. Stock is deducted live in SAP ZPULSE_INV upon Verification Officer physical release.
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-volt text-volt-text self-start sm:self-auto">
              {outgoingDispatches.length} Outbound Pending
            </span>
          </div>

          {outgoingDispatches.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-abyss-muted border border-dashed border-sand-border rounded-xl space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-abyss-elevated flex items-center justify-center text-volt">
                <CheckCheck className="w-5 h-5" />
              </div>
              <div className="font-bold text-abyss-text">No outgoing dispatches currently pending for facility {assignedHospitalId}.</div>
              <p className="text-[10px] text-abyss-muted">
                Approved reallocations where this facility is donor will appear here for physical dispatch.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {outgoingDispatches.map((shipment) => (
                <div
                  key={shipment.id}
                  className="p-4 rounded-xl bg-abyss-elevated border border-sand-border space-y-3 font-mono text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-abyss-text">
                      <span>{shipment.id}</span>
                      <CopyButton text={shipment.id} label="Copy Shipment ID" />
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-sand-base text-sand-text font-bold">
                      {shipment.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-abyss-muted block text-[9px] uppercase">Material</span>
                      <div className="flex items-center gap-1">
                        <strong className="text-volt">{shipment.material_id}</strong>
                        <CopyButton text={shipment.material_id} label="Copy Material ID" />
                      </div>
                    </div>
                    <div>
                      <span className="text-abyss-muted block text-[9px] uppercase">Quantity</span>
                      <strong className="text-abyss-text">{shipment.qty} Units</strong>
                    </div>
                    <div>
                      <span className="text-abyss-muted block text-[9px] uppercase">Destination</span>
                      <strong className="text-abyss-text">{shipment.dest_hospital_id}</strong>
                    </div>
                    <div>
                      <span className="text-abyss-muted block text-[9px] uppercase">Order Type</span>
                      <strong className="text-abyss-text">{shipment.order_type}</strong>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2 border-t border-sand-border">
                    <button
                      type="button"
                      onClick={() => handleApproveDispatch(shipment)}
                      disabled={shipmentActionId === shipment.id}
                      className="flex-1 py-2 px-3 rounded-lg bg-volt text-volt-text font-bold text-xs shadow-sm hover:bg-volt-hover active:scale-[0.99] transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#FFD400]"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>
                        {shipmentActionId === shipment.id ? 'Deducting in SAP...' : 'Approve Dispatch (-SAP)'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectDispatch(shipment)}
                      disabled={shipmentActionId === shipment.id}
                      className="px-3 py-2 rounded-lg bg-abyss-card border border-sand-border text-abyss-muted hover:text-red-400 hover:border-red-500/40 font-bold text-xs transition-colors disabled:opacity-50 flex items-center gap-1"
                      title="Reject Dispatch"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PHYSICAL STOCK COUNT LEDGER (STRICTLY LOCKED TO HOSPITAL)          */}
      {/* ========================================================================= */}
      {activeTab === 'AUDIT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Assigned Facility Inventory Ledger (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-xl bg-abyss-card border border-sand-border p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-sand-border pb-3">
                <div className="flex items-center space-x-2">
                  <ClipboardList className="w-4 h-4 text-volt" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-abyss-text">
                    Facility {assignedHospitalId} Physical Inventory Ledger
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-abyss-muted">
                  Last updated: {lastUpdated}
                </span>
              </div>

              {facilityInventory.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-abyss-muted">
                  No inventory records found for facility {assignedHospitalId}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-sand-border text-[10px] text-abyss-muted uppercase tracking-wider bg-abyss-elevated">
                        <th className="py-2.5 px-3">Medicine ID</th>
                        <th className="py-2.5 px-3 text-right">Physical Stock</th>
                        <th className="py-2.5 px-3 text-right">Daily Use</th>
                        <th className="py-2.5 px-3 text-right">Cover</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand-border">
                      {facilityInventory.map((item) => {
                        const isSelected = selectedMaterial === item.MATERIAL_ID;
                        const days = item.daysCover ?? Math.floor(item.STOCK_QTY / (item.DAILY_USE || 1));
                        const isCritical = days < 5;

                        return (
                          <tr
                            key={item.MATERIAL_ID}
                            onClick={() => handleSelectItem(item)}
                            className={`cursor-pointer transition-colors hover:bg-abyss-elevated ${
                              isSelected ? 'bg-abyss-elevated' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 font-bold text-abyss-text flex items-center space-x-2">
                              <Package className="w-3.5 h-3.5 text-volt" />
                              <span>{item.MATERIAL_ID}</span>
                              <CopyButton text={item.MATERIAL_ID} label="Copy Material ID" />
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-abyss-text">
                              {item.STOCK_QTY} <span className="text-[10px] text-abyss-muted">{item.UNIT || 'EA'}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-abyss-muted">
                              {item.DAILY_USE}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  isCritical
                                    ? 'bg-volt text-volt-text font-black'
                                    : 'bg-sand-base text-sand-text'
                                }`}
                              >
                                {days}d
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {isCritical ? (
                                <span className="inline-flex items-center space-x-1 text-[10px] text-volt font-bold">
                                  <AlertTriangle className="w-3 h-3 text-volt" />
                                  <span>Deficit</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 text-[10px] text-abyss-text font-bold">
                                  <CheckCircle2 className="w-3 h-3 text-sand-border" />
                                  <span>Adequate</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectItem(item);
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                                  isSelected
                                    ? 'bg-volt text-volt-text'
                                    : 'bg-abyss-card text-abyss-muted hover:text-abyss-text border border-sand-border'
                                }`}
                              >
                                Select
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Audit History Log */}
            {recentAudits.length > 0 && (
              <div className="rounded-xl bg-abyss-card border border-sand-border p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-sand-border pb-2">
                  <span className="text-xs font-bold font-mono uppercase text-abyss-text flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-volt" />
                    <span>Recent Shift Physical Audit History</span>
                  </span>
                  <span className="text-[10px] font-mono text-abyss-muted">
                    {recentAudits.length} Recorded
                  </span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {recentAudits.map((a) => (
                    <div
                      key={a.id}
                      className="p-2.5 rounded-lg bg-abyss-elevated border border-sand-border flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-abyss-muted">{a.timestamp}</span>
                        <strong className="text-abyss-text">{a.materialId}</strong>
                        <span className="text-abyss-muted">Stock: {a.stockQty}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            a.daysCover < 5 ? 'bg-volt text-volt-text font-black' : 'bg-sand-base text-sand-text'
                          }`}
                        >
                          {a.daysCover}d cover
                        </span>
                        {a.alertTriggered && (
                          <span className="text-[10px] text-volt flex items-center gap-1">
                            <Mail className="w-3 h-3 text-volt" />
                            <span>Alert Dispatched</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Physical Stock Audit Submission Form (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl bg-abyss-card border border-sand-border p-5 shadow-sm space-y-4">
              <div className="border-b border-sand-border pb-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-volt block">
                  Auditor Physical Count Input
                </span>
                <h3 className="text-base font-bold text-abyss-text tracking-tight mt-0.5">
                  Update Stock Level in SAP
                </h3>
                <p className="text-xs text-abyss-muted font-mono mt-0.5">
                  Commits real-time physical count to SAP Gateway <code className="text-abyss-text">ZPLUSE_SRV</code>.
                </p>
              </div>

              <form onSubmit={handleSubmitCount} className="space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-[11px] text-abyss-muted mb-1 font-bold">
                    Medicine / Material ID
                  </label>
                  <select
                    value={selectedMaterial}
                    onChange={(e) => {
                      setSelectedMaterial(e.target.value);
                      const match = facilityInventory.find((i) => i.MATERIAL_ID === e.target.value);
                      if (match) {
                        setStockQty(match.STOCK_QTY);
                        setDailyUse(match.DAILY_USE);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-abyss-elevated border border-sand-border text-abyss-text focus:outline-none focus:border-volt"
                  >
                    {facilityInventory.map((item) => (
                      <option key={item.MATERIAL_ID} value={item.MATERIAL_ID}>
                        {item.MATERIAL_ID} ({item.CITY} • Current: {item.STOCK_QTY} {item.UNIT})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-abyss-muted mb-1 font-bold">
                      Physical Stock Count
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={stockQty}
                      onChange={(e) => setStockQty(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-abyss-elevated border border-sand-border text-abyss-text focus:outline-none focus:border-volt font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-abyss-muted mb-1 font-bold">
                      Daily Consumption
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={dailyUse}
                      onChange={(e) => setDailyUse(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-abyss-elevated border border-sand-border text-abyss-text focus:outline-none focus:border-volt"
                    />
                  </div>
                </div>

                {/* Live Buffer Projection Card */}
                <div
                  className={`p-3.5 rounded-lg border flex items-center justify-between ${
                    isCriticalDeficit
                      ? 'bg-volt/10 border-volt/40 text-volt'
                      : 'bg-abyss-elevated border-sand-border text-abyss-text'
                  }`}
                >
                  <div>
                    <div className="text-[10px] text-abyss-muted uppercase">Projected Days of Cover</div>
                    <div className="text-xl font-black">{liveDaysCover} Days</div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isCriticalDeficit ? 'bg-volt text-volt-text font-black' : 'bg-sand-base text-sand-text'
                      }`}
                    >
                      {isCriticalDeficit ? 'CRITICAL SHORTAGE' : 'ADEQUATE BUFFER'}
                    </span>
                    <div className="text-[9px] text-abyss-muted mt-0.5">Threshold: 5 Days</div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-volt text-volt-text font-bold text-xs uppercase tracking-wide hover:bg-volt-hover active:scale-[0.99] transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#FFD400]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Recording in SAP S/4HANA...' : 'Commit Count to SAP S/4HANA'}</span>
                </button>
              </form>

              {submitResult && (
                <div
                  className={`p-3 rounded-lg border text-xs font-mono ${
                    submitResult.type === 'success'
                      ? 'bg-sand-base text-sand-text border-sand-border'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  <div className="font-bold">{submitResult.message}</div>
                  {submitResult.data?.shortageAlertTriggered && (
                    <div className="mt-1 text-[11px] text-abyss-canvas font-bold flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Alert email automatically dispatched to hospital manager and regional authority.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Accessible Confirm Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
