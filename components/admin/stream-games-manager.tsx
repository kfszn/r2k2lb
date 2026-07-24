'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ControlTheBalance } from '@/components/admin/control-the-balance';
import { BonusHunts } from '@/components/admin/bonus-hunts';
import { SlotCalls } from '@/components/admin/slot-calls';
import { Predictions } from '@/components/admin/predictions';
import { Giveaway } from '@/components/admin/giveaway';
import { Scale, Gift, Phone, ArrowLeft, Brain, PartyPopper } from 'lucide-react';

type GameType = 'menu' | 'control-balance' | 'bonus-hunts' | 'slot-calls' | 'predictions' | 'giveaway';

const GAMES: { id: GameType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'control-balance',
    label: 'Control The Balance',
    description: 'Players try to control their balance and earn based on their performance',
    icon: <Scale className="h-7 w-7 text-primary" />,
  },
  {
    id: 'bonus-hunts',
    label: 'Bonus Hunts',
    description: 'Track and manage bonus hunt sessions and results',
    icon: <Gift className="h-7 w-7 text-primary" />,
  },
  {
    id: 'slot-calls',
    label: 'Slot Calls',
    description: 'Viewers call slots and see live results',
    icon: <Phone className="h-7 w-7 text-primary" />,
  },
  {
    id: 'predictions',
    label: 'Predictions',
    description: 'Guess The Balance and Guess The Multi — find the closest guess',
    icon: <Brain className="h-7 w-7 text-primary" />,
  },
  {
    id: 'giveaway',
    label: 'Giveaway',
    description: 'Keyword-based chat giveaways with a live entrant list and horse race winner picker',
    icon: <PartyPopper className="h-7 w-7 text-primary" />,
  },
];

export function StreamGamesManager() {
  const [selectedGame, setSelectedGame] = useState<GameType>('menu');

  const back = (
    <Button variant="ghost" size="sm" onClick={() => setSelectedGame('menu')} className="gap-1.5 text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" />
      Back to Games
    </Button>
  );

  if (selectedGame === 'control-balance') return <div className="space-y-4">{back}<ControlTheBalance /></div>;
  if (selectedGame === 'bonus-hunts') return <div className="space-y-4">{back}<BonusHunts /></div>;
  if (selectedGame === 'slot-calls') return <div className="space-y-4">{back}<SlotCalls /></div>;
  if (selectedGame === 'predictions') return <div className="space-y-4">{back}<Predictions /></div>;
  if (selectedGame === 'giveaway') return <div className="space-y-4">{back}<Giveaway /></div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {GAMES.map((game) => (
        <Card
          key={game.id}
          className="cursor-pointer transition-all border-border/60 hover:border-primary/40 hover:bg-muted/20 hover:shadow-sm"
          onClick={() => setSelectedGame(game.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 mb-2">
              {game.icon}
              <CardTitle className="text-base">{game.label}</CardTitle>
            </div>
            <CardDescription className="text-xs leading-relaxed">{game.description}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
