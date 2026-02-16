'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  onTimeUp?: () => void;
}

export function CountdownTimer({ onTimeUp }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState('');
  
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const nextSunday = new Date(now);
      nextSunday.setDate(now.getDate() + (7 - now.getDay()));
      nextSunday.setHours(0, 0, 0, 0);
      
      const diff = nextSunday.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('00:00:00');
        onTimeUp?.();
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining(`${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`);
    }
    
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [onTimeUp])
  
  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground mb-2">Time Remaining</p>
      <p className="text-4xl font-bold text-primary font-mono">{timeRemaining}</p>
    </div>
  );
}
