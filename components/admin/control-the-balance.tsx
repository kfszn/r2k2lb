'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Save, Clock, Play, Pause, RotateCcw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BalanceEntry {
  id: string;
  username: string;
  streamBalance: number;
  playerStartingBalance: number;
  playerFinishBalance: number;
}

export function ControlTheBalance() {
  const [gameTitle, setGameTitle] = useState('');
  const [entries, setEntries] = useState<BalanceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [customHours, setCustomHours] = useState('00');
  const [customMinutes, setCustomMinutes] = useState('00');
  const [customSeconds, setCustomSeconds] = useState('00');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning]);

  const startTimer = () => setTimerRunning(true);
  const stopTimer = () => setTimerRunning(false);
  const resetTimer = () => {
    setTimerRunning(false);
    setTimerSeconds(0);
  };

  const setCustomTime = () => {
    const hours = parseInt(customHours) || 0;
    const minutes = parseInt(customMinutes) || 0;
    const seconds = parseInt(customSeconds) || 0;
    setTimerSeconds(hours * 3600 + minutes * 60 + seconds);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculatePlayerBalanceBottom = (streamBalance: number, playerStartingBalance: number) => {
    return (streamBalance - playerStartingBalance).toFixed(2);
  };

  const calculateAmountEarned = (playerFinishBalance: number, streamBalance: number) => {
    const difference = playerFinishBalance - streamBalance;
    return (difference * 0.05).toFixed(2);
  };

  const addEntry = () => {
    if (entries.length < 10) {
      setEntries([
        ...entries,
        {
          id: Math.random().toString(),
          username: '',
          streamBalance: 0,
          playerStartingBalance: 0,
          playerFinishBalance: 0,
        },
      ]);
    }
  };

  const updateEntry = (id: string, field: keyof BalanceEntry, value: string | number) => {
    setEntries(
      entries.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              [field]: field === 'username' ? value : parseFloat(String(value)) || 0,
            }
          : entry
      )
    );
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter((entry) => entry.id !== id));
  };

  const formatMoney = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const handleSave = async () => {
    if (!gameTitle.trim()) {
      setError('Please enter a game title');
      return;
    }

    if (entries.length === 0) {
      setError('Please add at least one entry');
      return;
    }

    // Validate all entries have required fields
    if (entries.some((e) => !e.username.trim() || e.streamBalance === 0 || e.playerStartingBalance === 0 || e.playerFinishBalance === 0)) {
      setError('Please fill in username and all balance fields for each entry');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/stream-games/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: gameTitle,
          gameType: 'control_the_balance',
          entries: entries.map((e) => ({
            username: e.username,
            streamBalance: e.streamBalance,
            playerStartingBalance: e.playerStartingBalance,
            playerFinishBalance: e.playerFinishBalance,
            playerBalanceBottom: parseFloat(calculatePlayerBalanceBottom(e.streamBalance, e.playerStartingBalance)),
            amountEarned: parseFloat(calculateAmountEarned(e.playerFinishBalance, e.streamBalance)),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save game');
      }

      setSuccess('Game saved successfully!');
      setGameTitle('');
      setEntries([]);
      setTimerSeconds(0);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Timer */}
      <Card className="bg-primary/10 border-primary/20">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Clock className="h-6 w-6 text-primary" />
            <div className="text-4xl font-mono font-bold text-primary">{formatTime(timerSeconds)}</div>
          </div>
          
          {/* Timer Controls */}
          <div className="flex items-center justify-center gap-2">
            {!timerRunning ? (
              <Button onClick={startTimer} variant="outline" size="sm" className="gap-2">
                <Play className="h-4 w-4" />
                Start
              </Button>
            ) : (
              <Button onClick={stopTimer} variant="outline" size="sm" className="gap-2">
                <Pause className="h-4 w-4" />
                Stop
              </Button>
            )}
            <Button onClick={resetTimer} variant="outline" size="sm" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          {/* Custom Time Setter */}
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="0"
                max="23"
                value={customHours}
                onChange={(e) => setCustomHours(e.target.value.padStart(2, '0'))}
                className="w-16 text-center font-mono"
                placeholder="HH"
              />
              <span className="text-muted-foreground">:</span>
              <Input
                type="number"
                min="0"
                max="59"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value.padStart(2, '0'))}
                className="w-16 text-center font-mono"
                placeholder="MM"
              />
              <span className="text-muted-foreground">:</span>
              <Input
                type="number"
                min="0"
                max="59"
                value={customSeconds}
                onChange={(e) => setCustomSeconds(e.target.value.padStart(2, '0'))}
                className="w-16 text-center font-mono"
                placeholder="SS"
              />
            </div>
            <Button onClick={setCustomTime} variant="secondary" size="sm">
              Set Time
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Game Title</label>
          <Input
            placeholder="Enter a title for this game session"
            value={gameTitle}
            onChange={(e) => setGameTitle(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Entry Panels */}
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <Card key={entry.id} className="bg-card/50 backdrop-blur border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Entry {index + 1}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEntry(entry.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  {/* Username Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Username</label>
                    <Input
                      type="text"
                      placeholder="Enter username"
                      value={entry.username}
                      onChange={(e) => updateEntry(entry.id, 'username', e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  {/* Stream Balance Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stream Balance</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={entry.streamBalance || ''}
                        onChange={(e) => updateEntry(entry.id, 'streamBalance', e.target.value)}
                        disabled={loading}
                        className="pl-6"
                      />
                    </div>
                  </div>

                  {/* Player Starting Balance Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Player Starting</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={entry.playerStartingBalance || ''}
                        onChange={(e) => updateEntry(entry.id, 'playerStartingBalance', e.target.value)}
                        disabled={loading}
                        className="pl-6"
                      />
                    </div>
                  </div>

                  {/* Player Balance Bottom (Calculated) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Player Bottom</label>
                    <div className="bg-muted/50 rounded-md p-2 h-10 flex items-center px-3 font-mono text-sm font-semibold">
                      {formatMoney(calculatePlayerBalanceBottom(entry.streamBalance, entry.playerStartingBalance))}
                    </div>
                  </div>

                  {/* Player Finish Balance Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Player Finish</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={entry.playerFinishBalance || ''}
                        onChange={(e) => updateEntry(entry.id, 'playerFinishBalance', e.target.value)}
                        disabled={loading}
                        className="pl-6"
                      />
                    </div>
                  </div>

                  {/* Amount Earned (Calculated) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount Earned</label>
                    <div className="bg-green-500/10 rounded-md p-2 h-10 flex items-center px-3 font-mono text-sm font-semibold text-green-500">
                      {formatMoney(calculateAmountEarned(entry.playerFinishBalance, entry.streamBalance))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={addEntry}
            disabled={entries.length >= 10 || loading}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Entry {entries.length}/10
          </Button>
        </div>

        {error && <div className="text-sm text-destructive">{error}</div>}
        {success && <div className="text-sm text-green-500">{success}</div>}

        <Button
          onClick={handleSave}
          disabled={entries.length === 0 || loading || !gameTitle.trim()}
          className="w-full gap-2"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save All Entries ({entries.length}/10)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
