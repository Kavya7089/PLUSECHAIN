import React, { useEffect, useState, useRef } from 'react';
import { usePulseChain } from '../../context/PulseChainContext';
import { Layers, ChevronRight } from 'lucide-react';

const NUM_STAIRS = 6;

/**
 * Screen Title Helper for Stair Transition Badge
 */
const getScreenName = (screenNum) => {
  switch (screenNum) {
    case 1:
      return 'Control Tower Overview';
    case 2:
      return 'Disruption Alerts & Impact';
    case 3:
      return 'AI Recovery Planner';
    case 4:
      return 'Cold-Chain Compliance';
    case 5:
      return 'SAP Authorization & Transfer';
    case 6:
      return 'Supplier Fleet & Performance';
    case 7:
      return 'Enterprise Staff Directory';
    default:
      return `Screen ${screenNum}`;
  }
};

/**
 * StairTransition
 * Staggered staircase page transition that cascades vertical columns ("stairs")
 * across the viewport one by one whenever the active screen changes.
 * 
 * Features:
 * - 6 vertical stair columns with staggered cascading delays (0ms -> 250ms)
 * - Pure CSS keyframe execution immune to React DOM mount timing
 * - Leading-edge Taxi Volt (#FFD400) glowing accent border
 * - Self-cleaning timer cycle (Enter -> Exit -> Idle)
 * - Safe: pointer-events-none so interaction is never blocked
 */
export default function StairTransition() {
  const { activeScreen } = usePulseChain();
  const [stage, setStage] = useState('idle'); // 'idle' | 'enter' | 'exit'
  const [transitionScreen, setTransitionScreen] = useState(activeScreen);
  const isFirstRender = useRef(true);
  const prevScreenRef = useRef(activeScreen);

  useEffect(() => {
    // Skip on initial first mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (prevScreenRef.current !== activeScreen) {
      setTransitionScreen(activeScreen);
      prevScreenRef.current = activeScreen;

      // Phase 1: Stairs cascade down one by one
      setStage('enter');

      // Phase 2: Stairs slide out downwards one by one revealing target screen
      const exitTimer = setTimeout(() => {
        setStage('exit');
      }, 450);

      // Phase 3: Transition finishes, remove overlay
      const finishTimer = setTimeout(() => {
        setStage('idle');
      }, 1050);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(finishTimer);
      };
    }
  }, [activeScreen]);

  if (stage === 'idle') {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes stairSlideIn {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(0%);
          }
        }
        @keyframes stairSlideOut {
          0% {
            transform: translateY(0%);
          }
          100% {
            transform: translateY(100%);
          }
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 pointer-events-none flex overflow-hidden"
        aria-hidden="true"
      >
        {/* Central Screen Route Badge */}
        <div
          className={`absolute inset-0 flex items-center justify-center z-20 transition-all duration-300 ${
            stage === 'enter' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div className="px-5 py-2.5 rounded-2xl bg-volt text-volt-text font-mono font-black text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2.5 border border-volt/60 animate-in zoom-in-95 duration-200">
            <Layers className="w-4 h-4 text-volt-text animate-pulse" />
            <span>Navigating</span>
            <ChevronRight className="w-3.5 h-3.5 text-volt-text" />
            <span className="font-bold">{getScreenName(transitionScreen)}</span>
          </div>
        </div>

        {/* 6 Staggered Vertical Stair Columns (Pure Solid Opaque Columns — NO Glassmorphism) */}
        {Array.from({ length: NUM_STAIRS }).map((_, index) => {
          const delay = index * 50; // 0ms, 50ms, 100ms, 150ms, 200ms, 250ms
          const isEven = index % 2 === 0;

          return (
            <div
              key={index}
              className="stair-transition-col relative flex-1 h-full border-b-4 border-volt shadow-[0_12px_30px_rgba(255,212,0,0.35)]"
              style={{
                backgroundColor: isEven
                  ? 'var(--stair-bg-1, #081F20)'
                  : 'var(--stair-bg-2, #0D2C2E)',
                animation:
                  stage === 'enter'
                    ? 'stairSlideIn 360ms cubic-bezier(0.76, 0, 0.24, 1) forwards'
                    : 'stairSlideOut 360ms cubic-bezier(0.76, 0, 0.24, 1) forwards',
                animationDelay: `${delay}ms`,
                transform: 'translateY(-100%)',
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none',
                opacity: 1,
              }}
            >
              {/* Step Accent Tag at bottom of descending stair */}
              <div className="absolute bottom-4 left-0 right-0 text-center font-mono text-[10px] font-bold text-volt tracking-widest select-none">
                STEP 0{index + 1}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
