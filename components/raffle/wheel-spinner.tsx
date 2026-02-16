'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface WheelSpinnerProps {
  entries: Array<{ username: string; id: string }>;
  onWinnerSelected?: (winner: { username: string; id: string }) => void;
  isSpinning?: boolean;
}

export function WheelSpinner({ entries, onWinnerSelected, isSpinning = false }: WheelSpinnerProps) {
  const [selectedWinner, setSelectedWinner] = useState<{ username: string; id: string } | null>(null);
  const [spinning, setSpinning] = useState(false);
  
  const handleSpin = () => {
    if (entries.length === 0 || spinning || isSpinning) return;
    
    setSpinning(true);
    
    // Simulate spinning animation
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * entries.length);
      const winner = entries[randomIndex];
      setSelectedWinner(winner);
      setSpinning(false);
      onWinnerSelected?.(winner);
    }, 3000);
  };
  
  return (
    <Card className="border-primary/20 w-full">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-6">
          {/* Wheel visualization */}
          <div 
            className={`w-48 h-48 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold text-xl ${spinning || isSpinning ? 'animate-spin' : ''}`}
            style={{
              animationDuration: spinning || isSpinning ? '2s' : '0s',
            }}
          >
            {selectedWinner ? selectedWinner.username : 'SPIN'}
          </div>
          
          {/* Spin button */}
          <button
            onClick={handleSpin}
            disabled={spinning || isSpinning || entries.length === 0}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            {spinning || isSpinning ? 'Spinning...' : 'Spin the Wheel'}
          </button>
          
          {selectedWinner && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">🎉 Winner 🎉</p>
              <p className="text-2xl font-bold text-primary">{selectedWinner.username}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
