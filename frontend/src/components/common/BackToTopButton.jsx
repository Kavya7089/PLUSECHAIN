import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (window.scrollY > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      id="back-to-top"
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className="fixed bottom-5 right-20 z-40 p-2.5 rounded-xl bg-abyss-card border border-sand-border text-volt hover:bg-abyss-elevated hover:border-volt shadow-lg transition-all print:hidden focus-visible:ring-2 focus-visible:ring-[#FFD400]"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}
