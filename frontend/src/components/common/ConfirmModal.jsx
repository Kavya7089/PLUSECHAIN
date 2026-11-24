import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Accessible confirmation modal with keyboard trap & Escape key dismiss
 */
export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this operation?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onClose,
}) {
  const modalRef = useRef(null);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    if (confirmBtnRef.current) {
      confirmBtnRef.current.focus();
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-abyss-card border border-sand-border p-6 shadow-2xl text-abyss-text space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                isDestructive
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                  : 'bg-volt/10 text-volt border border-volt/30'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 id="confirm-modal-title" className="text-base font-bold text-abyss-text">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-abyss-muted hover:text-abyss-text hover:bg-abyss-elevated focus-visible:ring-2 focus-visible:ring-[#FFD400]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-abyss-muted leading-relaxed font-sans">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-sand-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-abyss-text bg-abyss-elevated border border-sand-border hover:bg-sand-border/40 transition-colors focus-visible:ring-2 focus-visible:ring-[#FFD400]"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-[#FFD400] ${
              isDestructive
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-volt text-volt-text hover:bg-volt-hover'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
