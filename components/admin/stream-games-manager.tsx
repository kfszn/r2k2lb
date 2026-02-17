'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ControlTheBalance } from '@/components/admin/control-the-balance';
import { BonusHunts } from '@/components/admin/bonus-hunts';
import { SlotCalls } from '@/components/admin/slot-calls';
import { Scale, Gift, Phone, ArrowLeft } from 'lucide-react';

type GameType = 'menu' | 'control-balance' | 'bonus-hunts' | 'slot-calls';

export function StreamGamesManager() {
  const [selectedGame, setSelectedGame] = useState<GameType>('menu');

  if (selectedGame === 'control-balance') {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedGame('menu')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Games
        </Button>
        <ControlTheBalance />
      </div>
    );
  }

  if (selectedGame === 'bonus-hunts') {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedGame('menu')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Games
        </Button>
        <BonusHunts />
      </div>
    );
  }

  if (selectedGame === 'slot-calls') {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedGame('menu')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Games
        </Button>
        <SlotCalls />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-primary/20 hover:border-primary/50"
        onClick={() => setSelectedGame('control-balance')}
      >
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Scale className="h-8 w-8 text-primary" />
            <CardTitle>Control The Balance</CardTitle>
          </div>
          <CardDescription>
            Players try to control their balance and earn based on their performance
          </CardDescription>
        </CardHeader>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-primary/20 hover:border-primary/50"
        onClick={() => setSelectedGame('bonus-hunts')}
      >
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Gift className="h-8 w-8 text-primary" />
            <CardTitle>Bonus Hunts</CardTitle>
          </div>
          <CardDescription>
            Track and manage bonus hunt sessions and results
          </CardDescription>
        </CardHeader>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-primary/20 hover:border-primary/50"
        onClick={() => setSelectedGame('slot-calls')}
      >
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Phone className="h-8 w-8 text-primary" />
            <CardTitle>Slot Calls</CardTitle>
          </div>
          <CardDescription>
            Viewers call slots and see live results
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
