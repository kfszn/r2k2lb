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
    <div className="w-full bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-b border-primary/20 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-2">
          <Gift className="h-3.5 w-3.5 text-primary animate-pulse flex-shrink-0" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Total Given Away:
          </span>
          <span className="text-xs font-bold text-primary">
            {loading ? 'Loading...' : total}
          </span>
          {!loading && (
            <span className="text-xs text-primary/60 ml-1">Live</span>
          )}
        </div>
      </div>
    </div>
  );
}
