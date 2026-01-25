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
      console.log('[v0] Updated giveaway total:', value);
    } catch (error) {
      console.error('[v0] Error updating giveaway total:', error);
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
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 backdrop-blur-sm hover:bg-primary/15 transition-all duration-300">
      <Gift className="h-4 w-4 text-primary animate-pulse" />
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Total Given Away
        </span>
        <span className="text-sm font-bold text-primary">
          {loading ? 'Loading...' : total}
        </span>
      </div>
      {!loading && (
        <span className="text-xs text-muted-foreground ml-2 opacity-50">
          Live
        </span>
      )}
    </div>
  );
}
