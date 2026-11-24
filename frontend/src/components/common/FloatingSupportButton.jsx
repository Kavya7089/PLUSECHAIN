import React, { useState } from 'react';
import { PhoneCall, Mail, X, ShieldAlert } from 'lucide-react';

export default function FloatingSupportButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div id="support-fab" className="fixed bottom-5 right-5 z-40 print:hidden">
      {isOpen && (
        <div className="mb-3 w-80 rounded-xl bg-abyss-card border border-sand-border p-4 shadow-2xl text-abyss-text space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-sand-border pb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-volt" />
              <span className="text-xs font-bold uppercase tracking-wider text-abyss-text">
                Team Techy's • Regional Admin Desk
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-abyss-muted hover:text-abyss-text hover:bg-abyss-elevated"
              aria-label="Close support dialog"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-abyss-muted leading-relaxed">
            For critical medicine stockouts, cold-chain excursion reports, or SAP Gateway outages:
          </p>

          <div className="space-y-2 text-xs font-mono">
            <a
              href="tel:+919691475225"
              className="flex items-center gap-2 p-2 rounded-lg bg-abyss-elevated border border-sand-border hover:border-volt text-abyss-text transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-volt" />
              <div>
                <div className="text-[10px] text-abyss-muted">24/7 Crisis Hotline</div>
                <div className="font-bold">+91 96914 75225</div>
              </div>
            </a>

            <a
              href="mailto:kavya.0111cd231058@technocratsgrou.com?subject=CRITICAL%20SHORTAGE%20ESCALATION"
              className="flex items-center gap-2 p-2 rounded-lg bg-abyss-elevated border border-sand-border hover:border-volt text-abyss-text transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-volt" />
              <div>
                <div className="text-[10px] text-abyss-muted">Regional Admin (Team Techy's)</div>
                <div className="font-bold truncate text-[11px]">kavya.0111cd231058@technocratsgrou.com</div>
              </div>
            </a>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open emergency supply chain desk"
        className="p-3.5 rounded-full bg-volt text-volt-text font-bold shadow-xl hover:bg-volt-hover active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-[#FFD400] flex items-center justify-center"
      >
        <PhoneCall className="w-5 h-5" />
      </button>
    </div>
  );
}
