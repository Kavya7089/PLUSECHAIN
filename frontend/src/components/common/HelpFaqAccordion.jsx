import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Shield, Truck, Zap, Activity } from 'lucide-react';

const FAQ_ITEMS = [
  {
    id: 'sap-sync',
    icon: Shield,
    question: 'How does SAP ZPULSE_INV update via 2-step Verification Officer approval?',
    answer:
      'Inventory adjustments require a strict two-step chain of custody: First, the source hospital Cold-Chain & Stock Verification Officer authorizes a Physical Dispatch (-QTY committed live to SAP ZPULSE_INV). Second, upon transit arrival, the receiving destination hospital Cold-Chain & Stock Verification Officer inspects temperature data loggers and authorizes a Goods Receipt (+QTY committed live to SAP ZPULSE_INV). No stock quantity is ever created or destroyed client-side.',
  },
  {
    id: 'hana-trust',
    icon: Activity,
    question: 'How does SAP HANA calculate the 8-Factor Supplier Trust Score natively?',
    answer:
      'Supplier Trust Scores (0–100) and qualification tiers (Platinum ≥90, Gold ≥75, Silver ≥60, Blocked <60) are executed directly in SAP S/4HANA core table ZPULSE_SUPP. The calculation balances 8 weighted performance factors: Delivery Speed, On-Time Rate, Reliability, Quality Score, Emergency Response, Cold-Chain Compliance, Fulfilment Rate, and Documentation/Certification. The frontend acts strictly as a zero-math passthrough.',
  },
  {
    id: 'osrm-rule',
    icon: Truck,
    question: 'How does OSRM enforce the Travel Time + 1 Day delay rule?',
    answer:
      'Live road routes, transit distances (km), and drive durations (hours) are queried from Open Source Routing Machine (OSRM). The resilience engine calculates the maximum allowable lead time as Math.ceil(DriveHours / 24) + 1 Day. If a supplier bids with a lead time exceeding this limit, the system enforces a mandatory, auditable Delay Reason before bid submission.',
  },
  {
    id: 'risk-sensing',
    icon: Zap,
    question: 'How do Open-Meteo and GDELT risk sensing function?',
    answer:
      'External supply-chain sensing polls real-time meteorological metrics (temperature, precipitation, wind gusts) from Open-Meteo alongside real-time civil/logistical disturbance events from GDELT Project DOC 2.0. The telemetry is evaluated by Google Gemini to assign a regional risk verdict (ON_TIME, DELAYED, or CANCELLATION_RISK) mapped to the target hospital hub.',
  },
];

export default function HelpFaqAccordion({ className = '' }) {
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={`rounded-xl bg-abyss-card border border-sand-border p-5 space-y-4 ${className}`}>
      <div className="flex items-center gap-2 text-abyss-text border-b border-sand-border pb-3">
        <HelpCircle className="w-4 h-4 text-volt" />
        <h3 className="text-sm font-bold tracking-tight">Enterprise Operational Guidelines & Architecture FAQ</h3>
      </div>

      <div className="divide-y divide-sand-border">
        {FAQ_ITEMS.map((item) => {
          const Icon = item.icon;
          const isOpen = openId === item.id;
          return (
            <div key={item.id} className="py-3">
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between text-left gap-3 text-xs font-semibold text-abyss-text hover:text-volt transition-colors focus-visible:ring-2 focus-visible:ring-[#FFD400]"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-volt shrink-0" />
                  <span>{item.question}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-abyss-muted transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180 text-volt' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="mt-2 text-xs text-abyss-muted leading-relaxed font-sans pl-5 animate-in fade-in">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
