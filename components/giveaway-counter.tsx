'use client';

import { useEffect, useState } from 'react';
import { Gift } from 'lucide-react';

export function GiveawayCounter() {
  const [total, setTotal] = useState<string>('$0');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const SHEET_ID = '10EgU6DCEYVorur1snG3YLNqQf0AAAcTQoHcBUr4VDQY';
  const GID = '624457277'; // 4th sheet
  const TARGET_CELL = 'C7';

  const fetchGiveawayTotal = async () => {
    try {
      // CSV export URL for public Google Sheets
      const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
      
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error('Failed to fetch sheet');
      
      const csv = await response.text();
      const rows = csv.split('\n').filter(row => row.trim());
      
      // Parse CSV - C7 means row 7, column C (column index 2)
      if (rows.length > 6) {
        const rowData = rows[6].split(',');
        if (rowData.length > 2) {
          const value = rowData[2].trim().replace(/"/g, '');
          setTotal(value || '$0');
          console.log('[v0] Fetched giveaway total:', value);
        }
      }
      
      setLoading(false);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('[v0] Error fetching giveaway total:', error);
      setLoading(false);
    }
  };

  // Fetch on mount and set up interval for every 5 seconds
  useEffect(() => {
    fetchGiveawayTotal();
    
    const interval = setInterval(fetchGiveawayTotal, 5000);
    
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
