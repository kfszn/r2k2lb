'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endDate?: string;
  onTimeUp?: () => void;
}

export function CountdownTimer({ endDate, onTimeUp }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState('');
  
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      
      // Use provided end date or default to next Sunday
      let targetDate = new Date(now);
      if (endDate) {
        targetDate = new Date(endDate);
        targetDate.setHours(23, 59, 59, 999);
      } else {
        targetDate.setDate(now.getDate() + (7 - now.getDay()));
        targetDate.setHours(0, 0, 0, 0);
      }
      
      const diff = targetDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('00d 00h 00m 00s');
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
  }, [endDate, onTimeUp])
  
  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground mb-2">Time Remaining</p>
      <p className="text-4xl font-bold text-primary font-mono">{timeRemaining}</p>
    </div>
  );
}
