'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trophy, CheckCircle, Loader2 } from 'lucide-react';

interface PredictionEntry {
  id: string;
  type: string;
  kick_username: string;
  guess: number;
  created_at: string;
  updated_at: string;
}

interface PredictionSettings {
  type: string;
  is_open: boolean;
  label: string;
}

interface PredictionGroup {
  settings: PredictionSettings;
  entries: PredictionEntry[];
}

interface Winner {
  kick_username: string;
  guess: number;
  actual_value: number;
  diff: number;
}

interface PredictionCardProps {
  group: PredictionGroup;
  onToggle: (type: string, is_open: boolean) => Promise<void>;
  onResolve: (type: string, actualValue: string) => Promise<void>;
  resolving: boolean;
}

function PredictionCard({ group, onToggle, onResolve, resolving }: PredictionCardProps) {
  const { settings, entries } = group;
  const [actualValue, setActualValue] = useState('');
  const [toggling, setToggling] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setToggling(true);
    await onToggle(settings.type, checked);
    setToggling(false);
  };

  const handleResolve = async () => {
    if (!actualValue) return;
    await onResolve(settings.type, actualValue);
    setActualValue('');
  };

  const isGTM = settings.type === 'gtm';

  return (
    <Card className="border-border/60 flex-1 min-w-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold">{settings.label}</span>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.is_open}
                onCheckedChange={handleToggle}
                disabled={toggling}
                id={`toggle-${settings.type}`}
              />
              <label
                htmlFor={`toggle-${settings.type}`}
                className={`text-xs font-medium cursor-pointer transition-colors ${settings.is_open ? 'text-green-400' : 'text-muted-foreground'}`}
              >
                {settings.is_open ? 'Open' : 'Closed'}
              </label>
            </div>
          </div>
          {entries.length > 0 && (
            <span className="text-xs font-semibold tabular-nums bg-primary/10 text-primary border border-primary/20 rounded px-1.5 py-0.5 leading-none">
              {entries.length}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Entry list */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          {entries.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No entries yet
            </div>
          ) : (
            <div className="max-h-52 overflow-y-auto">
              <div className="grid grid-cols-[1fr_auto] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30 border-b border-border/40 sticky top-0">
                <div>Username</div>
                <div className="text-right">{isGTM ? 'Multi' : 'Balance'}</div>
              </div>
              {entries.map((entry, idx) => (
                <div
                  key={entry.id}
                  className={`grid grid-cols-[1fr_auto] px-3 py-2 items-center hover:bg-muted/20 transition-colors ${idx < entries.length - 1 ? 'border-b border-border/30' : ''}`}
                >
                  <span className="text-sm font-medium">{entry.kick_username}</span>
                  <span className="text-sm tabular-nums text-right">
                    {isGTM ? `${entry.guess}x` : `$${Number(entry.guess).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolve section */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block uppercase tracking-wide">
              Actual {isGTM ? 'Multi' : 'Balance'}
            </label>
            <Input
              type="number"
              placeholder={isGTM ? 'e.g. 247.5' : 'e.g. 1500.00'}
              value={actualValue}
              onChange={(e) => setActualValue(e.target.value)}
              className="h-8 text-sm"
              min="0"
              step={isGTM ? '0.01' : '0.01'}
            />
          </div>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs px-3"
            onClick={handleResolve}
            disabled={!actualValue || entries.length === 0 || resolving}
          >
            {resolving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
            Resolve
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function Predictions() {
  const [gtb, setGtb] = useState<PredictionGroup | null>(null);
  const [gtm, setGtm] = useState<PredictionGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvingType, setResolvingType] = useState<string | null>(null);
  const [winner, setWinner] = useState<Winner | null>(null);
  const [winnerLabel, setWinnerLabel] = useState('');
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/admin/predictions');
    if (!res.ok) return;
    const data = await res.json();
    setGtb(data.gtb);
    setGtm(data.gtm);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleToggle = async (type: string, is_open: boolean) => {
    await fetch('/api/admin/predictions/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, is_open }),
    });
    await fetchData();
  };

  const handleResolve = async (type: string, actualValue: string) => {
    setResolvingType(type);
    const res = await fetch('/api/admin/predictions/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, actual_value: parseFloat(actualValue) }),
    });
    const data = await res.json();
    setResolvingType(null);

    if (data.winner) {
      setWinner(data.winner);
      setWinnerLabel(type === 'gtb' ? 'Guess The Balance' : 'Guess The Multi');
      setWinnerModalOpen(true);
      await fetchData();
    }
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">Loading...</div>
      ) : (
        <div className="flex gap-4 flex-col md:flex-row">
          {gtb && (
            <PredictionCard
              group={gtb}
              onToggle={handleToggle}
              onResolve={handleResolve}
              resolving={resolvingType === 'gtb'}
            />
          )}
          {gtm && (
            <PredictionCard
              group={gtm}
              onToggle={handleToggle}
              onResolve={handleResolve}
              resolving={resolvingType === 'gtm'}
            />
          )}
        </div>
      )}

      {/* Winner Modal */}
      <Dialog open={winnerModalOpen} onOpenChange={setWinnerModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-yellow-500" />
              {winnerLabel} — Winner
            </DialogTitle>
          </DialogHeader>

          {winner && (
            <div className="space-y-3">
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-4 text-center">
                <p className="text-lg font-bold text-foreground">{winner.kick_username}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Closest guess</p>
              </div>

              <div className="rounded-lg border border-border/50 bg-muted/20 divide-y divide-border/30">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs text-muted-foreground">Their guess</span>
                  <span className="text-sm font-semibold tabular-nums">{winner.guess}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs text-muted-foreground">Actual value</span>
                  <span className="text-sm font-semibold tabular-nums">{winner.actual_value}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs text-muted-foreground">Difference</span>
                  <span className="text-sm font-semibold tabular-nums text-green-400">{Number(winner.diff).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button size="sm" onClick={() => setWinnerModalOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
