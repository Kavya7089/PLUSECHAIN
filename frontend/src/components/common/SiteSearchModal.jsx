import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Building2, Pill, Truck, ArrowRight } from 'lucide-react';

const STATIC_SEARCH_DATA = [
  // Hospitals
  { type: 'hospital', id: 'H001', title: 'Metro Health Central (H001)', city: 'Bhopal', screen: 1 },
  { type: 'hospital', id: 'H002', title: "St. Luke's Memorial (H002)", city: 'Bhopal', screen: 1 },
  { type: 'hospital', id: 'H003', title: 'Mercy General Medical (H003)', city: 'Jabalpur', screen: 1 },
  { type: 'hospital', id: 'H004', title: 'Bhopal Apex Care Hospital (H004)', city: 'Bhopal', screen: 1 },
  { type: 'hospital', id: 'H005', title: 'Central Surplus Logistics Hub (H005)', city: 'Bhopal', screen: 1 },
  { type: 'hospital', id: 'H006', title: 'Valley Memorial Healthcare (H006)', city: 'Indore', screen: 1 },

  // Medicines
  { type: 'medicine', id: 'AMX250', title: 'Amoxicillin 250mg (AMX250)', category: 'Antibiotic', screen: 2 },
  { type: 'medicine', id: 'SAL500', title: 'Salbutamol 500mcg (SAL500)', category: 'Respiratory', screen: 2 },
  { type: 'medicine', id: 'PAR050', title: 'Paracetamol 500mg (PAR050)', category: 'Analgesic', screen: 2 },
  { type: 'medicine', id: 'OXY005', title: 'Medical Oxygen 5L (OXY005)', category: 'Critical Care', screen: 2 },
  { type: 'medicine', id: 'INS001', title: 'Insulin Glargine 100IU (INS001)', category: 'Cold-Chain Biologic', screen: 2 },

  // Suppliers
  { type: 'supplier', id: 'V1001', title: 'BioPharm Global Logistics (V1001)', tier: 'Platinum', city: 'Bhopal', screen: 6 },
  { type: 'supplier', id: 'V1002', title: 'Apex Medical Supplies (V1002)', tier: 'Gold', city: 'Indore', screen: 6 },
  { type: 'supplier', id: 'V1003', title: 'Reliant Cold-Chain Transport (V1003)', tier: 'Blocked', city: 'Jabalpur', screen: 6 },
];

export default function SiteSearchModal({ isOpen, onClose, onSelectResult }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = query.trim()
    ? STATIC_SEARCH_DATA.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.id.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          (item.city && item.city.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q)) ||
          (item.tier && item.tier.toLowerCase().includes(q))
        );
      })
    : [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Site Search"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-xl bg-abyss-card border border-sand-border shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-sand-border bg-abyss-elevated">
          <Search className="w-5 h-5 text-volt shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hospitals, medicines, suppliers, or SAP IDs... (Press Esc to close)"
            className="w-full bg-transparent text-sm text-abyss-text placeholder-abyss-muted/60 focus:outline-none font-sans"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded text-abyss-muted hover:text-abyss-text"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {!query.trim() ? (
            <div className="p-6 text-center text-xs text-abyss-muted space-y-1">
              <div>Type an ID like <span className="font-mono text-volt">H004</span>, <span className="font-mono text-volt">INS001</span>, or <span className="font-mono text-volt">V1001</span>.</div>
              <div className="text-[11px] opacity-70">Keyboard shortcut: Press <kbd className="px-1.5 py-0.5 rounded bg-abyss-elevated border border-sand-border text-[10px] text-abyss-text font-mono">/</kbd> anywhere to search.</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-abyss-muted">
              No matching hospital, material, or supplier found for "{query}".
            </div>
          ) : (
            <div className="divide-y divide-sand-border/50">
              {filtered.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  type="button"
                  onClick={() => {
                    onSelectResult(item);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg text-left hover:bg-abyss-elevated transition-colors text-xs group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-abyss-canvas text-volt border border-sand-border">
                      {item.type === 'hospital' && <Building2 className="w-4 h-4" />}
                      {item.type === 'medicine' && <Pill className="w-4 h-4" />}
                      {item.type === 'supplier' && <Truck className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-abyss-text group-hover:text-volt transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-abyss-muted font-mono">
                        {item.type.toUpperCase()} • {item.city || item.category || item.tier}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-volt opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Jump</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
