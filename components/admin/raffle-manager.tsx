'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RaffleConfig {
  platform: string;
  min_wager: number;
  prize_amount: number;
  max_entries: number;
  start_date: string;
  end_date: string;
}

function RaffleAdminTab({ platform }: { platform: 'acebet' | 'packdraw' }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<{ username: string; prizeAmount: number } | null>(null);
  const [adminSecret, setAdminSecret] = useState('');
  const [config, setConfig] = useState<RaffleConfig | null>(null);
  const [configForm, setConfigForm] = useState({ min_wager: 50, prize_amount: 1000, max_entries: 10000, start_date: '2026-02-14', end_date: '2026-02-21' });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  
  useEffect(() => {
    fetchConfig();
  }, [platform]);
  
  const fetchConfig = async () => {
    try {
      const response = await fetch(`/api/raffle/config?platform=${platform}`);
      const data = await response.json();
      setConfig(data);
      setConfigForm({
        min_wager: data.min_wager,
        prize_amount: data.prize_amount,
        max_entries: data.max_entries,
        start_date: data.start_date,
        end_date: data.end_date,
      });
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };
  
  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const response = await fetch('/api/raffle/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          ...configForm,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfig(data.data);
        alert('Configuration saved successfully!');
      } else {
        alert('Error saving configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error saving configuration');
    } finally {
      setIsSavingConfig(false);
    }
  };
  
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
          username: data.winner.username,
          prizeAmount: data.prizeAmount,
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
  
  return (
    <div className="space-y-6">
      {/* Settings */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Raffle Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Minimum Wager ($)</label>
              <Input
                type="number"
                value={configForm.min_wager || 0}
                onChange={(e) => setConfigForm({ ...configForm, min_wager: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Prize Amount ($)</label>
              <Input
                type="number"
                value={configForm.prize_amount || 0}
                onChange={(e) => setConfigForm({ ...configForm, prize_amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Max Entries</label>
              <Input
                type="number"
                value={configForm.max_entries || 0}
                onChange={(e) => setConfigForm({ ...configForm, max_entries: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Raffle Start Date</label>
              <Input
                type="date"
                value={configForm.start_date || ''}
                onChange={(e) => setConfigForm({ ...configForm, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Raffle End Date</label>
              <Input
                type="date"
                value={configForm.end_date || ''}
                onChange={(e) => setConfigForm({ ...configForm, end_date: e.target.value })}
              />
            </div>
          </div>

          <Button onClick={handleSaveConfig} disabled={isSavingConfig} className="w-full">
            {isSavingConfig ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>
      
      {/* Spin Raffle */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Select Winner</CardTitle>
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
          <Button onClick={handleSpinRaffle} disabled={isSpinning} className="w-full">
            {isSpinning ? 'Spinning...' : 'Spin Raffle'}
          </Button>
          
          {selectedWinner && (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm"><span className="font-medium">Last Winner:</span> {selectedWinner.username}</p>
              <p className="text-sm"><span className="font-medium">Prize:</span> ${selectedWinner.prizeAmount.toFixed(2)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function RaffleManager() {
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
