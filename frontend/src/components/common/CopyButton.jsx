import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * Reusable accessible Copy-to-Clipboard Button
 * With instant visual "Copied" feedback
 */
export default function CopyButton({
  text,
  label = 'Copy to clipboard',
  className = '',
  iconSize = 13,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.warn('Copy failed', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : label}
      title={copied ? 'Copied to clipboard' : label}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors focus-visible:ring-2 focus-visible:ring-[#FFD400] focus-visible:outline-none ${
        copied
          ? 'bg-[#FFD400] text-[#081F20] font-bold'
          : 'text-sand-text/70 hover:text-abyss-text hover:bg-abyss-elevated'
      } ${className}`}
    >
      {copied ? (
        <>
          <Check size={iconSize} className="text-[#081F20]" />
          <span className="text-[10px]">Copied</span>
        </>
      ) : (
        <Copy size={iconSize} />
      )}
    </button>
  );
}
