'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, Sparkles } from 'lucide-react';

interface RaffleSpinnerProps {
  entries: string[]; // weighted pool (names repeated by ticket count)
  winner: string | null;
  prizeAmount: number;
  isSpinning: boolean;
  spinKey?: number; // increment to force a new spin animation
  hasWinnerForPeriod?: boolean; // true if winner already picked for current period
  onSpinComplete?: () => void;
}

// Fisher-Yates shuffle — returns a new shuffled array
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build a display reel: shuffle the pool, then append enough copies so the
// reel is at least MIN_REEL_LENGTH entries long and ends on the winner.
const MIN_REEL_LENGTH = 60;

function buildReel(pool: string[], winner: string): string[] {
  if (pool.length === 0) return [winner];

  // Shuffle so consecutive same-name tickets are scattered
  let reel: string[] = [];
  while (reel.length < MIN_REEL_LENGTH) {
    reel = reel.concat(shuffle(pool));
  }

  // Make the last entry the winner so the reel always lands correctly
  reel.push(winner);
  return reel;
}

export function RaffleSpinner({
  entries,
  winner,
  prizeAmount,
  isSpinning,
  spinKey = 0,
  hasWinnerForPeriod = false,
  onSpinComplete,
}: RaffleSpinnerProps) {
  const VISIBLE = 5;
  const CENTER = 2; // index of the centre slot

  const [reel, setReel] = useState<string[]>([]);
  const [reelPos, setReelPos] = useState(0); // current index into reel[]
  const [phase, setPhase] = useState<'idle' | 'preview' | 'fast' | 'slowing' | 'landed'>('idle');
  const [glowIntensity, setGlowIntensity] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef(0);
  const reelRef = useRef<string[]>([]);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const clearPreview = () => {
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
      previewIntervalRef.current = null;
    }
  };

  // Derive 5 visible names from current reel position
  const getWindow = useCallback(
    (pos: number, r: string[]): string[] => {
      if (r.length === 0) return Array(VISIBLE).fill('---');
      const names: string[] = [];
      for (let i = -CENTER; i <= CENTER; i++) {
        const idx = Math.max(0, Math.min(r.length - 1, pos + i));
        names.push(r[idx]);
      }
      return names;
    },
    [],
  );

  const [displayedNames, setDisplayedNames] = useState<string[]>(Array(VISIBLE).fill('---'));

  // Kick off a new spin whenever spinKey changes (covers re-spins too)
  useEffect(() => {
    if (!isSpinning || !winner || entries.length === 0) return;

    clearTimer();
    clearPreview(); // stop the preview animation

    // Build a fresh shuffled reel
    const newReel = buildReel(entries, winner);
    reelRef.current = newReel;
    setReel(newReel);

    const winnerPos = newReel.length - 1; // winner always at the end
    const FAST_TICKS = 50;
    const SLOW_TICKS = 30;
    const TOTAL = FAST_TICKS + SLOW_TICKS;

    tickRef.current = 0;
    setPhase('fast');
    setGlowIntensity(0);

    // Start position near the beginning so there's plenty of reel to scroll
    let pos = 2;
    setReelPos(pos);
    setDisplayedNames(getWindow(pos, newReel));

    const doTick = () => {
      tickRef.current += 1;
      const t = tickRef.current;

      if (t <= FAST_TICKS) {
        // Fast phase: advance 2-3 slots per tick
        pos = Math.min(pos + 2, winnerPos - (TOTAL - t) - 2);
        pos = Math.max(pos, 2);
        const delay = 40 + (t / FAST_TICKS) * 20; // 40 → 60ms
        setPhase('fast');
        setReelPos(pos);
        setDisplayedNames(getWindow(pos, newReel));
        intervalRef.current = setTimeout(doTick, delay);
      } else if (t <= TOTAL) {
        // Slowing phase
        const progress = (t - FAST_TICKS) / SLOW_TICKS;
        setGlowIntensity(progress);
        setPhase('slowing');

        // Step 1 slot at a time, decelerating
        pos = Math.min(pos + 1, winnerPos);
        const delay = 60 + progress * 360; // 60ms → 420ms
        setReelPos(pos);
        setDisplayedNames(getWindow(pos, newReel));

        if (pos >= winnerPos) {
          // Landed early
          setReelPos(winnerPos);
          setDisplayedNames(getWindow(winnerPos, newReel));
          setPhase('landed');
          setGlowIntensity(1);
          onSpinComplete?.();
          return;
        }
        intervalRef.current = setTimeout(doTick, delay);
      } else {
        // Ensure we land exactly on winner
        setReelPos(winnerPos);
        setDisplayedNames(getWindow(winnerPos, newReel));
        setPhase('landed');
        setGlowIntensity(1);
        onSpinComplete?.();
      }
    };

    intervalRef.current = setTimeout(doTick, 40);

    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinKey]);

  // Control display state when not actively spinning
  useEffect(() => {
    if (isSpinning) return; // the spin effect handles this

    clearPreview();

    // Case 1: there is a winner for the current period → show landed state
    if (hasWinnerForPeriod && winner) {
      // Build a reel of all winner entries so getWindow(CENTER) centres on the winner
      const winnerReel = Array(VISIBLE).fill(winner);
      setPhase('landed');
      setGlowIntensity(1);
      setDisplayedNames(winnerReel);
      return;
    }

    // Case 2: no winner yet, but we have entries → run the preview rotation
    if (entries.length > 0) {
      const previewReel = shuffle([...entries]);
      const extendedReel = [...previewReel, ...previewReel, ...previewReel];
      let pos = 0;

      setPhase('preview');
      setGlowIntensity(0);
      setDisplayedNames(getWindow(pos, extendedReel));

      previewIntervalRef.current = setInterval(() => {
        pos = (pos + 1) % previewReel.length;
        setDisplayedNames(getWindow(pos, extendedReel));
      }, 800);

      return () => clearPreview();
    }

    // Case 3: no entries yet
    setPhase('idle');
    setGlowIntensity(0);
    setDisplayedNames(Array(VISIBLE).fill('---'));
  }, [isSpinning, hasWinnerForPeriod, winner, entries, getWindow]);

  const maskName = (name: string): string => {
    if (!name || name === '---') return '---';
    if (name.length <= 4) return name[0] + '*'.repeat(name.length - 1);
    return name.substring(0, 2) + '*'.repeat(name.length - 3) + name.substring(name.length - 1);
  };

  return (
    <div className="relative rounded-2xl border border-border/60 bg-secondary/30 overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, oklch(0.65 0.2 250 / ${glowIntensity * 0.15}) 0%, transparent 70%)`,
          opacity: glowIntensity,
        }}
      />

      <div className="relative px-6 py-8 sm:px-10">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-foreground">
            {phase === 'landed' ? 'This Period\'s Winner' : 'Live Draw'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {phase === 'idle' && 'Waiting for entries...'}
            {phase === 'preview' && (
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                Draw pending — entries rotating
              </span>
            )}
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

          {/* Centre highlight bar */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-14 border-y-2 z-10 pointer-events-none transition-all duration-500"
            style={{
              borderColor:
                phase === 'landed'
                  ? 'oklch(0.7 0.15 140)'
                  : phase === 'preview'
                  ? 'oklch(0.55 0.12 250)' // subtle primary glow for preview
                  : phase === 'idle'
                  ? 'oklch(0.25 0.04 260)'
                  : 'oklch(0.65 0.2 250)',
              boxShadow:
                phase === 'landed'
                  ? '0 0 30px oklch(0.7 0.15 140 / 0.3), inset 0 0 20px oklch(0.7 0.15 140 / 0.1)'
                  : phase === 'preview'
                  ? '0 0 15px oklch(0.55 0.12 250 / 0.15)'
                  : phase !== 'idle'
                  ? `0 0 ${20 * glowIntensity}px oklch(0.65 0.2 250 / ${0.2 * glowIntensity})`
                  : 'none',
            }}
          />

          {/* Name slots */}
          <div className="rounded-xl bg-background/60 border border-border/40 overflow-hidden">
            <div className="divide-y divide-border/20">
              {displayedNames.map((name, i) => {
                const isCenter = i === CENTER;
                const isLanded = phase === 'landed' && isCenter;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-center h-14 transition-all duration-150"
                    style={{
                      opacity: isCenter ? 1 : Math.max(0.2, 1 - Math.abs(i - CENTER) * 0.25),
                      transform: isCenter
                        ? 'scale(1.05)'
                        : `scale(${1 - Math.abs(i - CENTER) * 0.04})`,
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
