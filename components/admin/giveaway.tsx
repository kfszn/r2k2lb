'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Dices, Trash2, Trophy, X, Loader2 } from 'lucide-react';

interface GiveawayRow {
  id: string;
  keyword: string;
  is_open: boolean;
  created_at: string;
}

interface GiveawayEntry {
  id: string;
  giveaway_id: string;
  kick_username: string;
  entered_at: string;
}

export function Giveaway() {
  const [giveaway, setGiveaway] = useState<GiveawayRow | null>(null);
  const [entries, setEntries] = useState<GiveawayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [opening, setOpening] = useState(false);
  const [closing, setClosing] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Wheel state
  const [wheelModalOpen, setWheelModalOpen] = useState(false);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelWinner, setWheelWinner] = useState<GiveawayEntry | null>(null);
  const wheelCanvasRef = useRef<HTMLCanvasElement>(null);
  const wheelAngleRef = useRef(0);
  const wheelAnimFrameRef = useRef<number | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/admin/giveaway');
    if (!res.ok) return;
    const data = await res.json();
    setGiveaway(data.giveaway);
    setEntries(data.entries ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    return () => {
      if (wheelAnimFrameRef.current) cancelAnimationFrame(wheelAnimFrameRef.current);
    };
  }, []);

  const handleOpen = async () => {
    if (!keyword.trim()) return;
    setOpening(true);
    await fetch('/api/admin/giveaway/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword }),
    });
    setKeyword('');
    setOpening(false);
    await fetchData();
  };

  const handleClose = async () => {
    setClosing(true);
    await fetch('/api/admin/giveaway/close', { method: 'POST' });
    setClosing(false);
    await fetchData();
  };

  const handleClear = async () => {
    setClearing(true);
    await fetch('/api/admin/giveaway/clear', { method: 'POST' });
    setClearing(false);
    await fetchData();
  };

  const handleRemoveEntry = async (username: string) => {
    await fetch(`/api/admin/giveaway/entries/${encodeURIComponent(username)}`, { method: 'DELETE' });
    await fetchData();
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // ── Wheel ──────────────────────────────────────────────────────────────────

  const WHEEL_COLORS = [
    '#7c3aed', '#2563eb', '#0891b2', '#059669',
    '#d97706', '#dc2626', '#db2777', '#7c3aed',
  ];

  const drawWheel = useCallback((angle: number, items: GiveawayEntry[], winner: GiveawayEntry | null) => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const radius = Math.min(cx, cy) - 8;

    ctx.clearRect(0, 0, W, H);
    if (items.length === 0) return;

    const slice = (2 * Math.PI) / items.length;

    items.forEach((item, i) => {
      const start = angle + i * slice;
      const end = start + slice;
      const isWinner = winner && item.id === winner.id;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = isWinner ? '#f59e0b' : WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + slice / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(13, Math.max(9, 200 / items.length))}px sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 3;
      const label = item.kick_username.length > 14 ? item.kick_username.slice(0, 13) + '…' : item.kick_username;
      ctx.fillText(label, radius - 10, 4);
      ctx.restore();
    });

    // Center cap
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pointer
    ctx.save();
    ctx.translate(cx, 6);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-10, -18);
    ctx.lineTo(10, -18);
    ctx.closePath();
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.restore();
  }, []);

  const spinWheel = useCallback(() => {
    if (wheelSpinning || entries.length === 0) return;

    setWheelWinner(null);
    setWheelSpinning(true);

    const items = entries;
    const slice = (2 * Math.PI) / items.length;
    const winnerIndex = Math.floor(Math.random() * items.length);

    // The pointer is at the top of the wheel = -π/2 in canvas arc coords.
    // Slice i occupies [baseAngle + i*slice, baseAngle + i*slice + slice].
    // For the centre of winning slice to sit under the pointer:
    //   baseAngle + winnerIndex*slice + slice/2 ≡ -π/2  (mod 2π)
    const POINTER_ANGLE = -Math.PI / 2;
    const targetBaseAngle = POINTER_ANGLE - winnerIndex * slice - slice / 2;

    // Spin forward (always increasing angle) to reach targetBaseAngle.
    const TAU = 2 * Math.PI;
    const extraRotations = 6 + Math.random() * 4;
    let forward = (targetBaseAngle - wheelAngleRef.current) % TAU;
    if (forward <= 0) forward += TAU; // ensure strictly positive (0, 2π]
    const targetAngle = forward + extraRotations * TAU;

    const startAngle = wheelAngleRef.current;
    const startTime = performance.now();
    const duration = 4000 + Math.random() * 1500;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);
      wheelAngleRef.current = startAngle + eased * targetAngle;
      drawWheel(wheelAngleRef.current, items, null);

      if (progress < 1) {
        wheelAnimFrameRef.current = requestAnimationFrame(animate);
      } else {
        wheelAngleRef.current = startAngle + targetAngle;
        const w = items[winnerIndex];
        setWheelWinner(w);
        setWheelSpinning(false);
        drawWheel(wheelAngleRef.current, items, w);
      }
    };

    wheelAnimFrameRef.current = requestAnimationFrame(animate);
  }, [wheelSpinning, entries, drawWheel]);

  useEffect(() => {
    if (wheelModalOpen && !wheelSpinning) {
      const t = setTimeout(() => drawWheel(wheelAngleRef.current, entries, wheelWinner), 50);
      return () => clearTimeout(t);
    }
  }, [wheelModalOpen, entries, wheelWinner, wheelSpinning, drawWheel]);

  const handleConfirmAndClear = async () => {
    setWheelModalOpen(false);
    setWheelWinner(null);
    await handleClear();
    await handleClose();
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Giveaway</span>
            {giveaway?.is_open && (
              <span className="text-xs font-semibold tabular-nums bg-green-500/10 text-green-400 border border-green-500/20 rounded px-1.5 py-0.5 leading-none">
                Live
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* Open form */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block uppercase tracking-wide">
                Keyword
              </label>
              <Input
                placeholder="e.g. giveaway"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleOpen(); }}
                className="h-8 text-sm"
                disabled={opening}
              />
            </div>
            <div className="flex items-end gap-1.5">
              <Button
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={handleOpen}
                disabled={!keyword.trim() || opening}
              >
                {opening ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Open Giveaway'}
              </Button>
            </div>
          </div>

          {/* Active giveaway status */}
          {giveaway && (
            <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Keyword</p>
                  <p className="text-sm font-mono font-semibold mt-0.5">{giveaway.keyword}</p>
                </div>
                <div className="h-8 w-px bg-border/50" />
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Entries</p>
                  <p className="text-sm font-semibold mt-0.5">{entries.length}</p>
                </div>
                <div className="h-8 w-px bg-border/50" />
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Status</p>
                  <p className={`text-sm font-semibold mt-0.5 ${giveaway.is_open ? 'text-green-400' : 'text-muted-foreground'}`}>
                    {giveaway.is_open ? 'Open' : 'Closed'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {giveaway.is_open && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2.5"
                    onClick={handleClose}
                    disabled={closing}
                  >
                    {closing ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Close'}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Entries list */}
          {giveaway && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entrants</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {entries.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setWheelWinner(null); setWheelModalOpen(true); }}
                      className="h-7 gap-1.5 text-xs border-primary/30 hover:border-primary/60 hover:bg-primary/10 text-primary"
                    >
                      <Dices className="h-3.5 w-3.5" />
                      Roll Winner
                    </Button>
                  )}
                  {entries.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleClear}
                      disabled={clearing}
                      className="h-7 gap-1 text-xs text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="py-6 text-center text-xs text-muted-foreground">Loading...</div>
              ) : entries.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border/40 rounded-lg">
                  No entries yet
                </div>
              ) : (
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_auto] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30 border-b border-border/40">
                    <div>Username</div>
                    <div>Time</div>
                    <div className="w-7" />
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {entries.map((entry, idx) => (
                      <div
                        key={entry.id}
                        className={`grid grid-cols-[1fr_auto_auto] px-3 py-2 items-center hover:bg-muted/20 transition-colors ${idx < entries.length - 1 ? 'border-b border-border/30' : ''}`}
                      >
                        <span className="text-sm font-medium">{entry.kick_username}</span>
                        <span className="text-xs text-muted-foreground tabular-nums pr-3">{formatTime(entry.entered_at)}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveEntry(entry.kick_username)}
                          className="h-6 w-6 p-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wheel Modal */}
      <Dialog
        open={wheelModalOpen}
        onOpenChange={(open) => {
          if (!wheelSpinning) {
            setWheelModalOpen(open);
            if (!open && wheelAnimFrameRef.current) cancelAnimationFrame(wheelAnimFrameRef.current);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Dices className="h-4 w-4 text-primary" />
              Roll Winner
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {entries.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No entries to spin.</p>
            ) : (
              <>
                <div className="flex items-center justify-center p-2">
                  <canvas
                    ref={wheelCanvasRef}
                    width={360}
                    height={360}
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </div>

                {wheelWinner && !wheelSpinning && (
                  <div className="text-center animate-in fade-in slide-in-from-bottom-2 duration-400 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                      <span className="text-xs font-semibold text-yellow-500 uppercase tracking-wide">Winner</span>
                    </div>
                    <p className="text-base font-semibold text-foreground">{wheelWinner.kick_username}</p>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button size="sm" variant="outline" onClick={() => setWheelModalOpen(false)} disabled={wheelSpinning}>
              Close
            </Button>
            {entries.length > 0 && (
              <>
                <Button size="sm" onClick={spinWheel} disabled={wheelSpinning} className="gap-1.5">
                  <Dices className="h-3.5 w-3.5" />
                  {wheelSpinning ? 'Spinning...' : wheelWinner ? 'Spin Again' : 'Spin'}
                </Button>
                {wheelWinner && !wheelSpinning && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleConfirmAndClear}
                    className="gap-1.5 bg-green-600 hover:bg-green-700"
                  >
                    <Trophy className="h-3.5 w-3.5" />
                    Confirm & Clear
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
