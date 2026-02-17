'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy } from 'lucide-react';

interface RaffleSpinnerProps {
  entries: string[];
  winner: string | null;
  prizeAmount: number;
  isSpinning: boolean;
  onSpinComplete?: () => void;
}

export function RaffleSpinner({
  entries,
  winner,
  prizeAmount,
  isSpinning,
  onSpinComplete,
}: RaffleSpinnerProps) {
  const [displayedNames, setDisplayedNames] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'fast' | 'slowing' | 'landed'>('idle');
  const [glowIntensity, setGlowIntensity] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const tickCountRef = useRef(0);

  // Build the visible slot reel (5 names visible at a time)
  const VISIBLE = 5;

  const getVisibleNames = useCallback(
    (idx: number) => {
      if (entries.length === 0) return Array(VISIBLE).fill('---');
      const names: string[] = [];
      for (let i = -2; i <= 2; i++) {
        const mod = ((idx + i) % entries.length + entries.length) % entries.length;
        names.push(entries[mod]);
      }
      return names;
    },
    [entries],
  );

  // Start the spin animation when isSpinning becomes true
  useEffect(() => {
    if (isSpinning && entries.length > 0 && phase === 'idle') {
      setPhase('fast');
      setGlowIntensity(0);
      tickCountRef.current = 0;

      let idx = 0;
      let speed = 50; // ms between ticks
      const totalFastTicks = 40;
      const totalSlowTicks = 25;

      const winnerIdx = winner ? entries.indexOf(winner) : Math.floor(Math.random() * entries.length);
      const targetIdx = winnerIdx >= 0 ? winnerIdx : 0;

      const tick = () => {
        tickCountRef.current += 1;
        const t = tickCountRef.current;

        if (t < totalFastTicks) {
          // Fast phase: random rapid cycling
          idx = (idx + 1) % entries.length;
          setCurrentIndex(idx);
          setDisplayedNames(getVisibleNames(idx));
          intervalRef.current = setTimeout(tick, speed);
        } else if (t < totalFastTicks + totalSlowTicks) {
          // Slowing phase: decelerate toward winner
          setPhase('slowing');
          const progress = (t - totalFastTicks) / totalSlowTicks;
          setGlowIntensity(progress);
          speed = 50 + progress * 350; // slow from 50ms to 400ms

          // Steer toward winner in the last few ticks
          const remaining = totalFastTicks + totalSlowTicks - t;
          if (remaining <= 3) {
            const stepsToTarget = ((targetIdx - idx) % entries.length + entries.length) % entries.length;
            if (stepsToTarget > 0 && stepsToTarget <= 3) {
              idx = (idx + 1) % entries.length;
            } else {
              idx = (targetIdx - remaining + entries.length) % entries.length;
            }
          } else {
            idx = (idx + 1) % entries.length;
          }
          setCurrentIndex(idx);
          setDisplayedNames(getVisibleNames(idx));
          intervalRef.current = setTimeout(tick, speed);
        } else {
          // Land on winner
          setCurrentIndex(targetIdx);
          setDisplayedNames(getVisibleNames(targetIdx));
          setPhase('landed');
          setGlowIntensity(1);
          onSpinComplete?.();
        }
      };

      setDisplayedNames(getVisibleNames(0));
      intervalRef.current = setTimeout(tick, speed);
    }

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [isSpinning]);

  // Reset when not spinning
  useEffect(() => {
    if (!isSpinning && phase !== 'idle') {
      // Keep landed state for a while, then reset
      const timer = setTimeout(() => {
        if (!isSpinning) {
          setPhase('idle');
          setGlowIntensity(0);
        }
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [isSpinning, phase]);

  // Initialize display
  useEffect(() => {
    if (entries.length > 0 && phase === 'idle') {
      setDisplayedNames(getVisibleNames(0));
    }
  }, [entries, phase, getVisibleNames]);

  const maskName = (name: string): string => {
    if (!name || name === '---') return '---';
    if (name.length <= 4) return name[0] + '*'.repeat(name.length - 1);
    return name.substring(0, 2) + '*'.repeat(name.length - 3) + name.substring(name.length - 1);
  };

  return (
    <div className="relative rounded-2xl border border-border/60 bg-secondary/30 overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(ellipse at center, oklch(0.65 0.2 250 / ${glowIntensity * 0.15}) 0%, transparent 70%)`,
          opacity: glowIntensity,
        }}
      />

      <div className="relative px-6 py-8 sm:px-10">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-foreground">Winner Draw</h3>
          <p className="text-sm text-muted-foreground">
            {phase === 'idle' && 'Waiting for draw...'}
            {phase === 'fast' && 'Drawing winner...'}
            {phase === 'slowing' && 'Almost there...'}
            {phase === 'landed' && 'Winner selected!'}
          </p>
        </div>

        {/* Slot machine reel */}
        <div className="relative max-w-sm mx-auto">
          {/* Top/bottom fade overlays */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-secondary/90 to-transparent z-10 pointer-events-none rounded-t-xl" />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-secondary/90 to-transparent z-10 pointer-events-none rounded-b-xl" />

          {/* Center highlight bar */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-14 border-y-2 z-10 pointer-events-none transition-all duration-500"
            style={{
              borderColor: phase === 'landed'
                ? 'oklch(0.7 0.15 140)'
                : phase === 'idle'
                  ? 'oklch(0.25 0.04 260)'
                  : 'oklch(0.65 0.2 250)',
              boxShadow: phase === 'landed'
                ? '0 0 30px oklch(0.7 0.15 140 / 0.3), inset 0 0 20px oklch(0.7 0.15 140 / 0.1)'
                : phase !== 'idle'
                  ? `0 0 ${20 * glowIntensity}px oklch(0.65 0.2 250 / ${0.2 * glowIntensity})`
                  : 'none',
            }}
          />

          {/* Name slots */}
          <div className="rounded-xl bg-background/60 border border-border/40 overflow-hidden">
            <div className="divide-y divide-border/20">
              {displayedNames.map((name, i) => {
                const isCenter = i === 2;
                const isLanded = phase === 'landed' && isCenter;
                return (
                  <div
                    key={`${name}-${i}-${currentIndex}`}
                    className="flex items-center justify-center h-14 transition-all duration-200"
                    style={{
                      opacity: isCenter ? 1 : 0.3 + (1 - Math.abs(i - 2) * 0.2),
                      transform: isCenter ? 'scale(1.05)' : `scale(${1 - Math.abs(i - 2) * 0.05})`,
                      background: isLanded ? 'oklch(0.7 0.15 140 / 0.1)' : 'transparent',
                    }}
                  >
                    <span
                      className={`text-base font-mono font-semibold tracking-wide transition-colors duration-300 ${
                        isLanded
                          ? 'text-chart-3'
                          : isCenter
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {maskName(name)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Winner celebration */}
        {phase === 'landed' && winner && (
          <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-chart-3/10 border border-chart-3/20 mb-3">
              <Trophy className="w-4 h-4 text-chart-3" />
              <span className="text-sm font-semibold text-chart-3">Winner!</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{maskName(winner)}</p>
            <p className="text-lg font-bold text-chart-3 mt-1">
              +${prizeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
