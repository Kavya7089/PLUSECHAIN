import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'pulsechain_cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'acknowledged');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      id="cookie-banner"
      className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-abyss-card border-t border-sand-border shadow-2xl print:hidden animate-in slide-in-from-bottom duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-abyss-text">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-volt shrink-0" />
          <span className="text-abyss-muted">
            PulseChain uses strict encrypted session tokens and local storage solely for role-based tenant access, SAP audit trails, and user security. No tracking cookies are used.
          </span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 px-4 py-1.5 rounded-lg bg-volt text-volt-text font-bold text-xs hover:bg-volt-hover transition-colors focus-visible:ring-2 focus-visible:ring-[#FFD400]"
        >
          Acknowledge & Continue
        </button>
      </div>
    </div>
  );
}
