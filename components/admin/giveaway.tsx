'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Flag, Trash2, X, Loader2 } from 'lucide-react';
import { HorseRaceDialog } from '@/components/admin/horse-race';

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

  // Horse race modal state
  const [raceModalOpen, setRaceModalOpen] = useState(false);

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

  const handleConfirmAndClear = async () => {
    setRaceModalOpen(false);
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
                      onClick={() => setRaceModalOpen(true)}
                      className="h-7 gap-1.5 text-xs border-primary/30 hover:border-primary/60 hover:bg-primary/10 text-primary"
                    >
                      <Flag className="h-3.5 w-3.5" />
                      Start Race
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

      {/* Horse Race Modal */}
      <HorseRaceDialog
        open={raceModalOpen}
        onOpenChange={setRaceModalOpen}
        entries={entries}
        onConfirmAndClear={handleConfirmAndClear}
      />
    </div>
  );
}
