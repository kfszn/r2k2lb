'use client';

import { useEffect, useState } from 'react';
import { Gift } from 'lucide-react';
import { fetchGiveawayTotal } from '@/lib/giveaway-actions';

export function GiveawayCounter() {
  const [total, setTotal] = useState<string>('$0');
  const [loading, setLoading] = useState(true);

  const updateTotal = async () => {
    try {
      const value = await fetchGiveawayTotal();
      setTotal(value);
    } catch {
      // Silent fail - keep showing last known value
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and set up interval for every 5 seconds
  useEffect(() => {
    updateTotal();
    
    const interval = setInterval(updateTotal, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-gradient-to-r from-primary/15 via-primary/5 to-primary/15 border-b border-primary/15 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-1.5">
        <div className="flex items-center justify-center gap-2">
          <Gift className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Given Away:
          </span>
          <span className="text-[11px] font-bold text-primary">
            {loading ? '...' : total}
          </span>
          {!loading && (
            <span className="inline-flex items-center gap-1 text-[10px] text-green-400/80 ml-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
