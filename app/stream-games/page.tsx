'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2 } from 'lucide-react';

interface SlotCall {
  id: string;
  username: string;
  slot_name: string;
  buy_amount: number;
  buy_result: number;
  multiplier?: number;
  created_at: string;
}

export default function StreamGamesPage() {
  const [slotCalls, setSlotCalls] = useState<SlotCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchCompletedCalls = async () => {
    try {
      const { data } = await supabase
        .from('slot_calls')
        .select('*')
        .not('buy_amount', 'is', null)
        .not('buy_result', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) {
        // Calculate multiplier
        const withMultiplier = data.map((call) => ({
          ...call,
          multiplier: call.buy_amount > 0 ? call.buy_result / call.buy_amount : 0,
        }));
        setSlotCalls(withMultiplier);
      }
    } catch (error) {
      console.error('Error fetching slot calls:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCompletedCalls();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchCompletedCalls, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Gamepad2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Stream Games - Slot Calls</h1>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Completed Slot Calls</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : slotCalls.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No completed slot calls yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-primary/20">
                      <th className="text-left px-4 py-3 font-semibold">Username</th>
                      <th className="text-left px-4 py-3 font-semibold">Slot Name</th>
                      <th className="text-left px-4 py-3 font-semibold">Buy Amount</th>
                      <th className="text-left px-4 py-3 font-semibold">Buy Result</th>
                      <th className="text-left px-4 py-3 font-semibold">Multiplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slotCalls.map((call) => (
                      <tr key={call.id} className="border-b border-primary/10 hover:bg-background/50">
                        <td className="px-4 py-3 font-medium">{call.username}</td>
                        <td className="px-4 py-3">{call.slot_name}</td>
                        <td className="px-4 py-3">${call.buy_amount.toFixed(2)}</td>
                        <td className="px-4 py-3 text-green-500 font-medium">
                          ${call.buy_result.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {call.multiplier?.toFixed(2)}x
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
