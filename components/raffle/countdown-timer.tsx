'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endDate?: string;
  onTimeUp?: () => void;
}

export function CountdownTimer({ endDate, onTimeUp }: CountdownTimerProps) {
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calculate = () => {
      const now = new Date();
      let target = new Date(now);
      if (endDate) {
        target = new Date(endDate + 'T23:59:59');
      } else {
        target.setDate(now.getDate() + (7 - now.getDay()));
        target.setHours(0, 0, 0, 0);
      }

      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setDays(0);
        setHours(0);
        setMinutes(0);
        setSeconds(0);
        setExpired(true);
        onTimeUp?.();
        return;
      }

      setExpired(false);
      setDays(Math.floor(diff / (1000 * 60 * 60 * 24)));
      setHours(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
      setMinutes(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
      setSeconds(Math.floor((diff % (1000 * 60)) / 1000));
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [endDate, onTimeUp]);

  const blocks = [
    { value: days, label: 'Days' },
    { value: hours, label: 'Hours' },
    { value: minutes, label: 'Mins' },
    { value: seconds, label: 'Secs' },
  ];

  return (
    <div className="flex items-center justify-center gap-3">
      {blocks.map((block, i) => (
        <div key={block.label} className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-primary/20 blur-md" />
              <div className="relative w-16 h-18 sm:w-20 sm:h-22 flex items-center justify-center rounded-xl bg-secondary border border-border/80">
                <span className="text-3xl sm:text-4xl font-bold font-mono text-foreground tabular-nums">
                  {String(block.value).padStart(2, '0')}
                </span>
              </div>
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground mt-2 uppercase tracking-wider">
              {block.label}
            </span>
          </div>
          {i < blocks.length - 1 && (
            <span className="text-2xl font-bold text-muted-foreground mb-6">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
