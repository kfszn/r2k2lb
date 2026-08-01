"use client";

import { BracketDisplay } from "@/components/tournament/bracket-display";
import { HowToEnter } from "@/components/tournament/how-to-enter";
import { WinnersCircle } from "@/components/tournament/winners-circle";
import { LiveEntries } from "@/components/tournament/live-entries";
import { GiveawayCounter } from "@/components/giveaway-counter";
import { useBracket } from "@/lib/bracket-context";
import { Header } from "@/components/header";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Trophy,
  Swords,
  Radio,
  Users,
  Zap,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TournamentMeta {
  id: string;
  status: string;
  name: string;
  game_name: string;
  bet_amount: number;
  max_players: number;
  prize_pool?: number | null;
}

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  registration: {
    label: "Registering",
    color: "border-green-500/30 bg-green-500/10 text-green-400",
    dot: "bg-green-400",
  },
  live: {
    label: "Live",
    color: "border-red-500/30 bg-red-500/10 text-red-400",
    dot: "bg-red-500 animate-pulse",
  },
};

function formatCurrency(cents: number): string {
  const dollars = (cents || 0) / 100;
  return `$${dollars.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: "primary" | "green" | "yellow";
}

function StatTile({ icon, label, value, accent = "primary" }: StatTileProps) {
  const accentCls =
    accent === "green"
      ? "border-green-500/20 bg-green-500/10 text-green-400"
      : accent === "yellow"
      ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
      : "border-primary/20 bg-primary/10 text-primary";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 p-4">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${accentCls}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-lg font-bold tabular-nums truncate">{value}</p>
      </div>
    </div>
  );
}

export default function TournamentPage() {
  const { matches, loadBracketForTournament } = useBracket();
  const [tournament, setTournament] = useState<TournamentMeta | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [activeCount, setActiveCount] = useState<number>(0);

  useEffect(() => {
    const supabase = createClient();

    const fetchTournament = async () => {
      const { data } = await supabase
        .from("tournaments")
        .select("id, status, name, game_name, bet_amount, max_players, prize_pool")
        .eq("is_current", true)
        .in("status", ["registration", "live"])
        .single();

      setTournament(data ?? null);
      setIsLoaded(true);
    };

    fetchTournament();

    const channel = supabase
      .channel("tournament-page-status")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tournaments" },
        (payload) => {
          const n = payload.new as TournamentMeta & { is_current?: boolean };
          if (
            n?.is_current === true &&
            ["registration", "live"].includes(n?.status)
          ) {
            setTournament(n);
          } else if (
            tournament?.id === (payload.old as { id?: string })?.id
          ) {
            setTournament(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!tournament?.id) return;
    loadBracketForTournament(tournament.id);

    const supabase = createClient();
    supabase
      .from("tournament_players")
      .select("id, acebet_active", { count: "exact" })
      .eq("tournament_id", tournament.id)
      .then(({ data, count }) => {
        setPlayerCount(count ?? 0);
        setActiveCount((data ?? []).filter((p) => p.acebet_active).length);
      });
  }, [tournament?.id, loadBracketForTournament]);

  const isActive = tournament && isLoaded;
  const isLive = tournament?.status === "live";
  const isRegistration = tournament?.status === "registration";
  const hasBracket = isActive && matches.length > 0;
  const statusMeta = STATUS_META[tournament?.status ?? ""] ?? null;

  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />

      {isActive ? (
        <main>
          {/* ── Sticky banner ─────────────────────────────────────── */}
          <div className="sticky top-0 z-10 border-b border-border/60 bg-card/60 backdrop-blur-sm">
            <div className="container mx-auto px-4 max-w-7xl">
              <div className="flex items-center justify-between h-12">
                <div className="flex items-center gap-3 min-w-0">
                  <Swords className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-semibold text-sm text-foreground truncate">
                    {tournament.name}
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline shrink-0">
                    {tournament.game_name} &middot; ${tournament.bet_amount} buy-in
                  </span>
                </div>
                {statusMeta && (
                  <Badge
                    variant="outline"
                    className={`text-xs gap-1.5 shrink-0 ${statusMeta.color}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                    {statusMeta.label}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
            {/* ── Stat tiles ────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile
                icon={<Users className="h-4 w-4" />}
                label="Players"
                value={`${playerCount}/${tournament.max_players}`}
                accent="primary"
              />
              <StatTile
                icon={<Zap className="h-4 w-4" />}
                label="Active"
                value={String(activeCount)}
                accent="green"
              />
              <StatTile
                icon={<Radio className="h-4 w-4" />}
                label="Matches"
                value={String(matches.length)}
                accent="primary"
              />
              <StatTile
                icon={<TrendingUp className="h-4 w-4" />}
                label="Prize Pool"
                value={
                  tournament.prize_pool
                    ? `$${tournament.prize_pool.toLocaleString()}`
                    : "—"
                }
                accent="yellow"
              />
            </div>

            {/* ── Main content ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
              {/* Sidebar */}
              <aside className="space-y-4 order-2 lg:order-1">
                <HowToEnter minWager={0} requireActive={true} />
                {isRegistration && <LiveEntries />}
                <WinnersCircle />
              </aside>

              {/* Bracket / empty bracket state */}
              <section className="order-1 lg:order-2 min-w-0">
                <div className="rounded-xl border border-border/40 bg-card/40 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                    <div className="flex items-center gap-2">
                      <Swords className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm text-foreground">
                        Live Bracket
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isLive && (
                        <Badge
                          variant="outline"
                          className="border-red-500/30 bg-red-500/10 text-red-400 text-xs gap-1.5"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                          LIVE
                        </Badge>
                      )}
                      {matches.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {matches.length} matches
                        </span>
                      )}
                    </div>
                  </div>

                  {hasBracket ? (
                    <div className="p-3 sm:p-4">
                      <BracketDisplay />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-20 text-center px-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border/40 bg-card/60 mb-1">
                        <Swords className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        Bracket not set yet
                      </p>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        {isRegistration
                          ? "Registration is open — the bracket will appear once players are seeded."
                          : "The bracket will appear here once the tournament goes live."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Live entries in the main column when live (bracket takes full width) */}
                {isLive && (
                  <div className="mt-4">
                    <LiveEntries />
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
      ) : (
        /* ── No active tournament ───────────────────────────────────── */
        <main className="min-h-[calc(100vh-64px)]">
          <div className="container mx-auto px-4 max-w-7xl py-10 space-y-6">
            {/* Hero */}
            <div className="rounded-xl border border-border/40 bg-card/40 p-8 flex flex-col items-center text-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border/40 bg-card/60">
                <Trophy className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  No Active Tournament
                </h1>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">
                  There&apos;s no tournament running right now. Follow R2K2 on
                  Kick to be notified when the next one starts.
                </p>
              </div>
              <a
                href="https://kick.com/r2k2lb"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                <Radio className="h-4 w-4" />
                Watch on Kick
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <HowToEnter minWager={0} requireActive={true} />
              <WinnersCircle />
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
