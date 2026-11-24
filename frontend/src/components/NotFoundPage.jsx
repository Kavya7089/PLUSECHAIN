import React from 'react';
import { Home, ShieldAlert } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFoundPage({ onGoHome }) {
  useDocumentTitle('404 Page Not Found', 'The requested view does not exist in PulseChain Control Tower.');

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-abyss-canvas text-abyss-text">
      <div className="max-w-md w-full rounded-xl bg-abyss-card border border-sand-border p-8 text-center space-y-5 shadow-2xl">
        <div className="inline-flex p-4 rounded-2xl bg-volt/10 text-volt border border-volt/30">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <div className="text-3xl font-black font-mono text-volt">404</div>
          <h1 className="text-lg font-bold text-abyss-text">ERP Route Not Found</h1>
          <p className="text-xs text-abyss-muted leading-relaxed font-sans">
            The requested screen or record does not exist or has been relocated within the PulseChain Control Tower.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onGoHome}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-volt text-volt-text font-bold text-xs hover:bg-volt-hover transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-[#FFD400]"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
