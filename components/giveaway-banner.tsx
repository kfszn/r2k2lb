'use client';

import { useEffect, useState } from 'react';
import { Gift } from 'lucide-react';
import { fetchGiveawayTotal } from '@/lib/giveaway-actions';

export function GiveawayBanner() {
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
    <div className="w-full bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-b border-primary/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-3">
          <Gift className="h-5 w-5 text-primary animate-pulse" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Given Away
            </span>
            <span className="text-2xl font-bold text-primary">
              {loading ? 'Loading...' : total}
            </span>
          </div>
          {!loading && (
            <span className="text-xs text-muted-foreground ml-2 opacity-50">
              Live
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
