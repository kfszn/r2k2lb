"use client";

import { useEffect, useState } from "react";
import { Trophy, Crown, Medal } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";

interface Winner {
  roobet_username: string | null;
  legacy_acebet_username: string | null;
  kick_username: string | null;
  tournament_name: string;
  prize_amount: number;
  tournament_id: string | null;
}

export function WinnersCircle() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchWinners() {
      const { data, error } = await supabase
        .from("tournament_winners")
        .select("roobet_username, legacy_acebet_username, kick_username, tournament_name, prize_amount, tournament_id")
        .order("won_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        const tournamentIds = [...new Set(data.map((w) => w.tournament_id).filter(Boolean))];
        if (tournamentIds.length > 0) {
          const { data: finishedTournaments } = await supabase
            .from("tournaments")
            .select("id, status")
            .in("id", tournamentIds);

          const finishedStatuses = new Set(["completed", "closed", "finished", "ended"]);
          const finishedIds = new Set(
            (finishedTournaments || [])
              .filter((t) => finishedStatuses.has(t.status))
              .map((t) => t.id)
          );
          setWinners(
            data.filter((w) => !w.tournament_id || finishedIds.has(w.tournament_id))
          );
        } else {
          setWinners(data);
        }
      }
      setIsLoading(false);
    }

    fetchWinners();

    const channel = supabase
      .channel("winners-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tournament_winners" },
        () => fetchWinners()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const rankMeta = (index: number) => {
    if (index === 0)
      return {
        icon: <Crown className="h-4 w-4 text-yellow-500" />,
        bg: "bg-yellow-500/8 border-yellow-500/20",
        text: "text-yellow-500",
      };
    if (index === 1)
      return {
        icon: <Medal className="h-4 w-4 text-slate-400" />,
        bg: "bg-slate-400/8 border-slate-400/20",
        text: "text-slate-400",
      };
    if (index === 2)
      return {
        icon: <Medal className="h-4 w-4 text-amber-600" />,
        bg: "bg-amber-600/8 border-amber-600/20",
        text: "text-amber-600",
      };
    return {
      icon: (
        <span className="w-4 text-center text-[11px] font-bold text-muted-foreground/60">
          {index + 1}
        </span>
      ),
      bg: "bg-muted/15 border-border/25",
      text: "text-muted-foreground",
    };
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
        <Trophy className="h-4 w-4 text-yellow-500" />
        <span className="font-semibold text-sm text-foreground">Hall of Fame</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : winners.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-center">
          <Trophy className="h-7 w-7 text-muted-foreground/25" />
          <p className="text-xs text-muted-foreground">No winners yet</p>
          <p className="text-[11px] text-muted-foreground/60">Be the first champion!</p>
        </div>
      ) : (
        <ScrollArea className="h-[280px]">
          <div className="p-2 space-y-1">
            {winners.map((winner, index) => {
              const { icon, bg, text } = rankMeta(index);
              const name =
                  winner.kick_username ?? winner.roobet_username ?? winner.legacy_acebet_username ?? "Unknown";
              return (
                <div
                  key={`${winner.tournament_id}-${name}`}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors ${bg}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex-shrink-0">{icon}</div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{name}</p>
                      <p className="text-[11px] text-muted-foreground/60 truncate">
                        {winner.tournament_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Trophy className="h-3 w-3 text-primary/60" />
                    <span className={`text-xs font-bold tabular-nums ${text}`}>
                      ${winner.prize_amount ?? 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
