'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Flag, Trophy, Loader2 } from 'lucide-react';

interface GiveawayEntry {
  id: string;
  giveaway_id: string;
  kick_username: string;
  entered_at: string;
}

interface Racer {
  entry: GiveawayEntry;
  color: string;
}

const MAX_LANES = 12;

const LANE_COLORS = [
  '#60a5fa', '#34d399', '#fbbf24', '#f87171',
  '#a78bfa', '#22d3ee', '#fb923c', '#e879f9',
  '#4ade80', '#38bdf8', '#facc15', '#f472b6',
];

interface HorseRaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: GiveawayEntry[];
  onConfirmAndClear: () => Promise<void> | void;
}

export function HorseRaceDialog({ open, onOpenChange, entries, onConfirmAndClear }: HorseRaceDialogProps) {
  const [phase, setPhase] = useState<'idle' | 'racing' | 'finished'>('idle');
  const [winner, setWinner] = useState<GiveawayEntry | null>(null);
  const [racers, setRacers] = useState<Racer[]>([]);
  const [progress, setProgress] = useState<number[]>([]);
  const [confirming, setConfirming] = useState(false);

  const animFrameRef = useRef<number | null>(null);
  const progressRef = useRef<number[]>([]);
  // Per-horse organic motion: random burst multiplier re-rolled every 200-400ms
  const burstsRef = useRef<{ mult: number; nextChange: number }[]>([]);
  const capsRef = useRef<number[]>([]);
  const winnerLaneRef = useRef(0);
  const lastTsRef = useRef(0);
  const startTsRef = useRef(0);
  const durationRef = useRef(10000);

  const stopAnimation = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  useEffect(() => stopAnimation, [stopAnimation]);

  // Reset when the dialog opens fresh
  useEffect(() => {
    if (open) {
      setPhase('idle');
      setWinner(null);
      setRacers([]);
      setProgress([]);
    } else {
      stopAnimation();
    }
  }, [open, stopAnimation]);

  const startRace = useCallback(() => {
    if (phase === 'racing' || entries.length === 0) return;

    // Winner is pre-determined from ALL entrants before the animation starts.
    // The race is purely a visualization of this result.
    const winnerEntry = entries[Math.floor(Math.random() * entries.length)];

    // Build visible lanes (max 12). Winner always races; fill the rest randomly.
    const others = entries.filter((e) => e.id !== winnerEntry.id);
    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [others[i], others[j]] = [others[j], others[i]];
    }
    const visible = [winnerEntry, ...others.slice(0, MAX_LANES - 1)];
    // Shuffle lane order so the winner isn't always lane 1
    for (let i = visible.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [visible[i], visible[j]] = [visible[j], visible[i]];
    }

    const newRacers: Racer[] = visible.map((entry, i) => ({
      entry,
      color: LANE_COLORS[i % LANE_COLORS.length],
    }));
    const laneCount = newRacers.length;
    winnerLaneRef.current = newRacers.findIndex((r) => r.entry.id === winnerEntry.id);

    progressRef.current = new Array(laneCount).fill(0);
    capsRef.current = newRacers.map(() => 0.78 + Math.random() * 0.16); // losers max out at 78-94%
    burstsRef.current = newRacers.map(() => ({ mult: 0.6 + Math.random() * 1.0, nextChange: 0 }));
    durationRef.current = 8000 + Math.random() * 4000; // 8-12 seconds
    startTsRef.current = 0;
    lastTsRef.current = 0;

    setRacers(newRacers);
    setProgress(new Array(laneCount).fill(0));
    setWinner(winnerEntry);
    setPhase('racing');

    const animate = (ts: number) => {
      if (!startTsRef.current) {
        startTsRef.current = ts;
        lastTsRef.current = ts;
      }
      const elapsed = ts - startTsRef.current;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;
      const duration = durationRef.current;
      const remaining = Math.max(duration - elapsed, 1);
      const winnerLane = winnerLaneRef.current;

      const p = progressRef.current;
      for (let i = 0; i < p.length; i++) {
        // Re-roll each horse's burst multiplier every 200-400ms for organic surges
        const burst = burstsRef.current[i];
        if (elapsed >= burst.nextChange) {
          burst.mult = i === winnerLane ? 0.65 + Math.random() * 1.1 : 0.35 + Math.random() * 1.45;
          burst.nextChange = elapsed + 200 + Math.random() * 200;
        }

        // Converge toward the target: winner -> 1.0 exactly at duration, others -> their cap.
        // The proportional step naturally accelerates the winner at the end while
        // losers ease off as they approach their caps.
        const target = i === winnerLane ? 1 : capsRef.current[i];
        const step = ((target - p[i]) / remaining) * dt * burst.mult;
        p[i] = Math.min(target, p[i] + Math.max(step, 0));
      }

      if (elapsed >= duration) p[winnerLane] = 1;
      setProgress([...p]);

      if (p[winnerLane] >= 1) {
        stopAnimation();
        setPhase('finished');
        return;
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [phase, entries, stopAnimation]);

  const handleConfirm = async () => {
    setConfirming(true);
    await onConfirmAndClear();
    setConfirming(false);
  };

  const racing = phase === 'racing';
  const finished = phase === 'finished';

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!racing) onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Flag className="h-4 w-4 text-primary" />
            Winner Race
          </DialogTitle>
        </DialogHeader>

        {entries.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">No entries to race.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">{entries.length}</span>{' '}
              {entries.length === 1 ? 'entrant' : 'entrants'} in the race
              {entries.length > MAX_LANES && (
                <span className="text-xs"> · showing {MAX_LANES} lanes, everyone can win</span>
              )}
            </p>

            {/* Race track */}
            <div className="relative overflow-hidden rounded-xl border border-border/60 bg-[#14202b]">
              {/* Finish line: checkered strip on the right */}
              <div
                aria-hidden="true"
                className="absolute right-8 top-0 bottom-0 w-2.5 opacity-80"
                style={{
                  backgroundImage:
                    'repeating-conic-gradient(#e5e7eb 0% 25%, #111827 25% 50%) ',
                  backgroundSize: '10px 10px',
                }}
              />
              <div aria-hidden="true" className="absolute right-2 top-1 text-lg">🏁</div>

              <div className="flex flex-col py-2">
                {(racers.length > 0 ? racers : entries.slice(0, MAX_LANES).map((entry, i) => ({ entry, color: LANE_COLORS[i % LANE_COLORS.length] }))).map((racer, i) => {
                  const p = progress[i] ?? 0;
                  const isWinnerLane = finished && winner?.id === racer.entry.id;
                  return (
                    <div
                      key={racer.entry.id}
                      className={`relative flex h-9 items-center border-b border-white/5 last:border-b-0 transition-colors ${
                        isWinnerLane ? 'bg-yellow-500/15' : ''
                      }`}
                    >
                      {/* Lane label */}
                      <div className="z-10 flex w-28 shrink-0 items-center gap-1.5 pl-2 pr-1">
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: racer.color }}
                        />
                        <span
                          className={`truncate text-xs font-medium ${
                            isWinnerLane ? 'text-yellow-300' : 'text-gray-300'
                          }`}
                        >
                          {racer.entry.kick_username}
                        </span>
                      </div>
                      {/* Track area */}
                      <div className="relative h-full flex-1 mr-10">
                        <span
                          className="absolute top-1/2 -translate-y-1/2 text-xl leading-none will-change-[left]"
                          style={{
                            left: `calc(${(p * 100).toFixed(2)}% - ${(p * 24).toFixed(1)}px)`,
                            transform: 'translateY(-50%) scaleX(-1)',
                            filter: isWinnerLane ? 'drop-shadow(0 0 6px rgba(250,204,21,0.9))' : 'none',
                          }}
                          aria-hidden="true"
                        >
                          🐎
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Winner overlay */}
              {finished && winner && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="animate-in fade-in zoom-in-95 duration-500 rounded-xl border border-yellow-500/40 bg-black/80 px-6 py-4 text-center shadow-[0_0_50px_-10px_rgba(250,204,21,0.5)]">
                    <p className="text-2xl font-bold text-yellow-400 text-balance">
                      {'\u{1F3C6}'} {winner.kick_username} WINS!
                    </p>
                  </div>
                </div>
              )}

              {/* Confetti burst */}
              {finished && (
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                  {Array.from({ length: 60 }).map((_, i) => {
                    const left = Math.random() * 100;
                    const delay = Math.random() * 0.4;
                    const dur = 1.6 + Math.random() * 1.6;
                    const size = 5 + Math.random() * 5;
                    const color = LANE_COLORS[i % LANE_COLORS.length];
                    return (
                      <span
                        key={i}
                        className="hr-confetti absolute rounded-[1px]"
                        style={{
                          left: `${left}%`,
                          top: '-12px',
                          width: `${size}px`,
                          height: `${size * 0.5}px`,
                          backgroundColor: color,
                          animationDelay: `${delay}s`,
                          animationDuration: `${dur}s`,
                        }}
                      />
                    );
                  })}
                  <style>{`
                    .hr-confetti {
                      animation-name: hr-confetti-fall;
                      animation-timing-function: ease-in;
                      animation-fill-mode: forwards;
                    }
                    @keyframes hr-confetti-fall {
                      0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                      100% { transform: translateY(480px) rotate(540deg); opacity: 0; }
                    }
                  `}</style>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)} disabled={racing}>
            Close
          </Button>
          {entries.length > 0 && (
            <>
              <Button size="sm" onClick={startRace} disabled={racing} className="gap-1.5">
                <Flag className="h-3.5 w-3.5" />
                {racing ? 'Racing...' : finished ? 'Race Again' : 'Start Race'}
              </Button>
              {finished && (
                <Button
                  size="sm"
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                >
                  {confirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trophy className="h-3.5 w-3.5" />}
                  Confirm & Clear
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
