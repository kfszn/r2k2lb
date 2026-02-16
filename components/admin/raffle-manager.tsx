'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RaffleEntry {
  id: string;
  username: string;
  wager_amount: number;
}

function RaffleAdminTab({ platform }: { platform: 'acebet' | 'packdraw' }) {
  const [entries, setEntries] = useState<RaffleEntry[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<RaffleEntry | null>(null);
  const [adminSecret, setAdminSecret] = useState('');
  
  const handleSpinRaffle = async () => {
    if (!adminSecret) {
      alert('Please enter admin secret');
      return;
    }
    
    setIsSpinning(true);
    
    try {
      const response = await fetch('/api/raffle/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, adminSecret }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSelectedWinner({
          id: data.winner.id,
          username: data.winner.username,
          wager_amount: data.prizeAmount,
        });
        alert(`🎉 Winner: ${data.winner.username} won $${data.prizeAmount.toFixed(2)}!`);
      } else {
        alert('Error: ' + (data.error || 'Failed to spin raffle'));
      }
    } catch (error) {
      console.error('Error spinning raffle:', error);
      alert('Error spinning raffle');
    } finally {
      setIsSpinning(false);
    }
  };
  
  const handleAddEntry = async () => {
    const username = prompt('Enter username:');
    const wager = prompt('Enter wager amount:');
    
    if (!username || !wager) return;
    
    try {
      const response = await fetch('/api/raffle/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          username,
          wager_amount: parseFloat(wager),
        }),
      });
      
      if (response.ok) {
        alert('Entry added successfully');
        // Refresh entries
      }
    } catch (error) {
      console.error('Error adding entry:', error);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="border-primary/20 bg-secondary/10">
        <CardHeader>
          <CardTitle>Raffle Controls - {platform.toUpperCase()}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Admin Secret</label>
            <Input
              type="password"
              placeholder="Enter admin secret"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleSpinRaffle}
              disabled={isSpinning}
              className="bg-primary hover:bg-primary/90"
            >
              {isSpinning ? 'Spinning...' : 'Spin Raffle Now'}
            </Button>
            <Button
              onClick={handleAddEntry}
              variant="outline"
            >
              Add Entry
            </Button>
          </div>
          
          {selectedWinner && (
            <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-sm font-medium">Last Winner:</p>
              <p className="text-lg font-bold text-green-600">{selectedWinner.username}</p>
              <p className="text-sm text-muted-foreground">${selectedWinner.wager_amount.toFixed(2)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RaffleAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Raffle Management</h1>
        <p className="text-muted-foreground">Control raffle entries and spin winners</p>
      </div>
      
      <Tabs defaultValue="acebet" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="acebet">Acebet</TabsTrigger>
          <TabsTrigger value="packdraw">Packdraw</TabsTrigger>
        </TabsList>
        
        <TabsContent value="acebet">
          <RaffleAdminTab platform="acebet" />
        </TabsContent>
        
        <TabsContent value="packdraw">
          <RaffleAdminTab platform="packdraw" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const RaffleManager = RaffleAdminPage;
