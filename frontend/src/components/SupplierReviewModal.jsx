import React, { useState } from 'react';
import axios from 'axios';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  X,
  Cpu,
  Star,
  Sliders,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api';

/**
 * SupplierReviewModal
 * Allows Hospital Managers & Regional Heads to submit post-delivery vendor rating reviews.
 * Transmits RFC to backend POST /api/suppliers/review which recalculates the 8-factor TrustScore
 * and SupplierTier natively in SAP HANA.
 */
export default function SupplierReviewModal({ isOpen, onClose, shipment, onReviewSuccess }) {
  if (!isOpen || !shipment) return null;

  const [factors, setFactors] = useState({
    deliverySpeed: 95,
    onTimeRate: 98,
    reliability: 96,
    qualityScore: 98,
    emergResponse: 90,
    coldChainScore: 97,
    fulfilmentRate: 99,
    docCertScore: 95,
  });
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const factorMeta = [
    { key: 'deliverySpeed', label: 'Delivery Speed (Velocity)', desc: 'Adherence to the 24-48h dispatch lead time window' },
    { key: 'onTimeRate', label: 'On-Time Arrival Rate', desc: 'Dock delivery punctuality vs expected arrival timestamp' },
    { key: 'reliability', label: 'Route & Transit Reliability', desc: 'Absence of route disruptions or unscheduled layovers' },
    { key: 'qualityScore', label: 'Product Quality & Packaging', desc: 'Physical lot integrity, unbroken tamper seals, and barcode clarity' },
    { key: 'emergResponse', label: 'Emergency Response Velocity', desc: 'Urgent hotline responsiveness for priority hospital requests' },
    { key: 'coldChainScore', label: 'Cold-Chain IoT Telemetry', desc: 'Data logger adherence to 2°C - 8°C temperature window' },
    { key: 'fulfilmentRate', label: 'Order Quantity Fulfilment', desc: 'Ratio of received units vs contracted order quantity' },
    { key: 'docCertScore', label: 'Regulatory Documentation & CoA', desc: 'Certificate of Analysis accuracy and batch release paperwork' },
  ];

  const handleSliderChange = (key, val) => {
    setFactors((prev) => ({
      ...prev,
      [key]: parseInt(val, 10),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        shipmentId: shipment.id,
        supplierId: shipment.supplier_id || shipment.supplierId || 'V1001',
        materialId: shipment.material_id || shipment.materialId || 'AMX002',
        hospitalId: shipment.dest_hospital_id || shipment.destHospitalId || shipment.hospital_id || 'H004',
        ratings: factors,
        comments: comments.trim() || 'Official Hospital Manager Post-Delivery Goods Inspection Review.',
      };

      const res = await axios.post(`${API_BASE_URL}/suppliers/review`, payload);

      if (res.data?.success) {
        setReviewResult(res.data);
        if (onReviewSuccess) {
          onReviewSuccess(res.data);
        }
      } else {
        setErrorMsg(res.data?.message || 'Failed to commit review to SAP S/4HANA.');
      }
    } catch (err) {
      console.error('Error submitting supplier review:', err);
      setErrorMsg(
        err.response?.data?.message ||
        'Network error communicating with SAP HANA rating service.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-7 bg-abyss-card border border-sand-border shadow-2xl space-y-5 text-abyss-text font-sans">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-abyss-elevated hover:bg-volt hover:text-volt-text text-abyss-muted border border-sand-border transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-sand-border pb-4 pr-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-abyss-elevated text-volt text-xs font-mono font-bold mb-2 border border-volt/30">
            <Cpu className="w-3.5 h-3.5 text-volt" />
            <span>SAP S/4HANA NATIVE RATING SYSTEM</span>
          </div>
          <h3 className="text-xl font-black text-abyss-text tracking-tight">
            Post-Delivery Supplier Performance Review
          </h3>
          <p className="text-xs text-abyss-muted font-mono mt-1">
            Shipment ID: <strong className="text-abyss-text">{shipment.id}</strong> • Vendor:{' '}
            <strong className="text-volt">{shipment.supplier_id || shipment.supplierId || 'V1001'}</strong> • Material:{' '}
            <strong className="text-emerald-600 dark:text-emerald-400">{shipment.material_id || shipment.materialId}</strong> (+{shipment.qty} Units)
          </p>
        </div>

        {/* Review Outcome Screen (Post-Submission) */}
        {reviewResult ? (
          <div className="space-y-5 py-2 animate-in zoom-in-95 duration-300">
            <div className="p-5 rounded-2xl bg-abyss-elevated border border-volt/40 space-y-3 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-volt/20 border border-volt/40 flex items-center justify-center text-volt">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-black text-abyss-text">Review Committed to SAP S/4HANA!</h4>
              <p className="text-xs text-abyss-muted font-mono">
                {reviewResult.message}
              </p>
            </div>

            {/* Newly Calculated SAP HANA Metrics Card */}
            <div className="p-5 rounded-2xl bg-abyss-elevated border border-sand-border space-y-4">
              <div className="flex items-center justify-between border-b border-sand-border pb-2">
                <span className="text-xs font-mono font-bold uppercase text-volt flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-volt" />
                  <span>Newly Recalculated in SAP HANA</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-volt text-volt-text font-black">
                  LIVE SAP ZPULSE_SUPP
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center font-mono">
                <div className="p-3 rounded-xl bg-abyss-card border border-sand-border">
                  <span className="text-[10px] text-abyss-muted block uppercase">Trust Score</span>
                  <span className="text-2xl font-black text-abyss-text">
                    {reviewResult.updated_metrics?.trustScore || reviewResult.updated_metrics?.TrustScore || 95}
                  </span>
                  <span className="text-[9px] text-volt block">/ 100 Max</span>
                </div>

                <div className="p-3 rounded-xl bg-abyss-card border border-sand-border">
                  <span className="text-[10px] text-abyss-muted block uppercase">Supplier Tier</span>
                  <span className="text-xl font-black text-volt">
                    {reviewResult.updated_metrics?.supplierTier || reviewResult.updated_metrics?.SupplierTier || 'PLATINUM'}
                  </span>
                  <span className="text-[9px] text-abyss-muted block">HANA Dynamic Tier</span>
                </div>

                <div className="p-3 rounded-xl bg-abyss-card border border-sand-border">
                  <span className="text-[10px] text-abyss-muted block uppercase">Procurement Status</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                    {reviewResult.updated_metrics?.isEligible || reviewResult.updated_metrics?.IsEligible ? 'ELIGIBLE' : 'DISQUALIFIED'}
                  </span>
                  <span className="text-[9px] text-abyss-muted block">Auto-Approved RFQs</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-volt text-volt-text font-bold text-xs shadow-md hover:bg-volt-hover transition-all"
              >
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="p-3 rounded-xl bg-abyss-elevated border border-sand-border text-xs font-mono flex items-center justify-between">
              <span className="text-abyss-muted">Rating Protocol:</span>
              <span className="text-volt font-bold">1 (Critical Deficit) to 100 (Flawless Delivery)</span>
            </div>

            {/* 8 Factor Sliders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[45vh] overflow-y-auto pr-1">
              {factorMeta.map(({ key, label, desc }) => (
                <div
                  key={key}
                  className="p-3 rounded-xl bg-abyss-elevated border border-sand-border space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono font-bold text-abyss-text">
                      {label}
                    </label>
                    <span
                      className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                        factors[key] >= 90
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : factors[key] >= 75
                          ? 'bg-volt/20 text-volt'
                          : 'bg-red-950 text-red-300'
                      }`}
                    >
                      {factors[key]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={factors[key]}
                    onChange={(e) => handleSliderChange(key, e.target.value)}
                    className="w-full accent-volt cursor-pointer"
                  />
                  <p className="text-[10px] text-abyss-muted font-mono leading-tight">
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Comments Field */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-abyss-muted mb-1 font-bold flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-volt" />
                <span>Auditor Comments & Inspection Notes</span>
              </label>
              <textarea
                rows={2}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="e.g. Arrived on schedule, seal unbroken, data logger verified 4.2°C consistently."
                className="w-full px-3.5 py-2 rounded-xl bg-abyss-elevated border border-sand-border text-abyss-text font-mono text-xs focus:border-volt focus:outline-none"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-3 border-t border-sand-border flex items-center justify-between">
              <span className="text-[10px] font-mono text-abyss-muted">
                Submits RFC to SAP S/4HANA OData <code className="text-volt">POST /SupplierSet</code>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-abyss-muted hover:text-abyss-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase font-mono tracking-wider bg-volt text-volt-text shadow-md hover:bg-volt-hover active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Cpu className="w-3.5 h-3.5 text-volt-text" />
                  <span>{submitting ? 'Recalculating in SAP HANA...' : 'Submit Review to SAP HANA'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
