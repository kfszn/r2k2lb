"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Crown, Medal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Winner {
  acebet_username: string;
  tournament_name: string;
  prize_amount: number;
}

export function WinnersCircle() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchWinners() {
      const { data, error } = await supabase
        .from("tournament_winners")
        .select("acebet_username, tournament_name, prize_amount")
        .order("won_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setWinners(data);
      }
      setIsLoading(false);
    }

    fetchWinners();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("winners-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tournament_winners" },
        () => {
          fetchWinners();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 text-center text-sm text-muted-foreground">{index + 1}</span>;
  };

  const getRankBg = (index: number) => {
    if (index === 0) return "bg-yellow-500/10 border-yellow-500/30";
    if (index === 1) return "bg-gray-400/10 border-gray-400/30";
    if (index === 2) return "bg-amber-600/10 border-amber-600/30";
    return "bg-muted/30 border-border/30";
  };

  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Winners Circle
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : winners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Trophy className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No winners yet</p>
            <p className="text-xs text-muted-foreground/70">Be the first champion!</p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-3">
            <div className="space-y-2">
              {winners.map((winner, index) => (
                <div
                  key={winner.acebet_username}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${getRankBg(index)}`}
                >
                  <div className="flex items-center gap-3">
                    {getRankIcon(index)}
                    <span className="font-medium text-foreground">{winner.acebet_username}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="font-bold text-primary">{winner.win_count}</span>
                    <span className="text-xs text-muted-foreground">
                      {winner.win_count === 1 ? "win" : "wins"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
