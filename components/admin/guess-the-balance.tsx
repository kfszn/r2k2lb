'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Save } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BalanceEntry {
  id: string;
  username: string;
  startingBalance: number;
  endingBalance: number;
}

export function GuessTheBalance() {
  const [gameTitle, setGameTitle] = useState('');
  const [entries, setEntries] = useState<BalanceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const addEntry = () => {
    if (entries.length < 10) {
      setEntries([
        ...entries,
        {
          id: Math.random().toString(),
          username: '',
          startingBalance: 0,
          endingBalance: 0,
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

  const calculateEarnings = (endingBalance: number) => {
    return (endingBalance * 0.05).toFixed(2);
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
    if (entries.some((e) => !e.username.trim() || e.startingBalance === 0 || e.endingBalance === 0)) {
      setError('Please fill in all fields for each entry');
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
          gameType: 'guess_the_balance',
          entries: entries.map((e) => ({
            username: e.username,
            startingBalance: e.startingBalance,
            endingBalance: e.endingBalance,
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
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
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

        <div className="rounded-lg border border-border/40 bg-card/50 backdrop-blur overflow-hidden">
          {entries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20 text-center">#</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead className="text-right">Starting Balance</TableHead>
                  <TableHead className="text-right">Ending Balance</TableHead>
                  <TableHead className="text-right">Amount Earned (5%)</TableHead>
                  <TableHead className="w-12 text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, index) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      <Input
                        placeholder="Enter username"
                        value={entry.username}
                        onChange={(e) => updateEntry(entry.id, 'username', e.target.value)}
                        disabled={loading}
                        className="border-0 bg-transparent px-0"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={entry.startingBalance || ''}
                        onChange={(e) => updateEntry(entry.id, 'startingBalance', e.target.value)}
                        disabled={loading}
                        className="border-0 bg-transparent px-0 text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={entry.endingBalance || ''}
                        onChange={(e) => updateEntry(entry.id, 'endingBalance', e.target.value)}
                        disabled={loading}
                        className="border-0 bg-transparent px-0 text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${calculateEarnings(entry.endingBalance)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEntry(entry.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p>No entries yet. Click "Add Entry" to get started.</p>
            </div>
          )}
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
