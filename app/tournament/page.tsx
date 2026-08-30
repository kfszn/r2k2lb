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
  BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

// ── Identical StatTile to admin ───────────────────────────────────────────────
interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: "primary" | "green" | "yellow";
}

function StatTile({ icon, label, value, accent = "primary" }: StatTileProps) {
  const accentCls =
    accent === "green"
      ? "border-green-500/20 bg-green-500/8 text-green-400"
      : accent === "yellow"
      ? "border-yellow-500/20 bg-yellow-500/8 text-yellow-400"
      : "border-primary/20 bg-primary/8 text-primary";
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
  const [playerCount, setPlayerCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

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
          if (n?.is_current === true && ["registration", "live"].includes(n?.status)) {
            setTournament(n);
          } else if (tournament?.id === (payload.old as { id?: string })?.id) {
            setTournament(null);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!tournament?.id) return;
    loadBracketForTournament(tournament.id);
    const supabase = createClient();
    supabase
      .from("tournament_players")
      .select("id, roobet_active", { count: "exact" })
      .eq("tournament_id", tournament.id)
      .then(({ data, count }) => {
        setPlayerCount(count ?? 0);
        setActiveCount((data ?? []).filter((p) => p.roobet_active).length);
      });
  }, [tournament?.id, loadBracketForTournament]);

  const isActive = tournament && isLoaded;
  const isLive = tournament?.status === "live";
  const hasBracket = isActive && matches.length > 0;
  const statusMeta = STATUS_META[tournament?.status ?? ""] ?? null;

  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />

      {isActive ? (
        <main>
          {/* ── Sticky banner — identical to admin top-bar ─────────── */}
          <div className="sticky top-0 z-10 border-b border-border/40 bg-card/60 backdrop-blur-sm">
            <div className="container mx-auto px-4 max-w-5xl">
              <div className="flex items-center justify-between h-12">
                <div className="flex items-center gap-3 min-w-0">
                  <Swords className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-semibold text-sm truncate">{tournament.name}</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline shrink-0">
                    {tournament.game_name} &middot; ${tournament.bet_amount} buy-in
                  </span>
                </div>
                {statusMeta && (
                  <Badge variant="outline" className={`text-xs gap-1.5 shrink-0 ${statusMeta.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                    {statusMeta.label}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">

            {/* ── Title block — mirrors admin tournament title ────────── */}
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">{tournament.name}</h1>
                {statusMeta && (
                  <Badge variant="outline" className={`text-xs gap-1.5 ${statusMeta.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                    {statusMeta.label}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {tournament.game_name} &middot; ${tournament.bet_amount} buy-in &middot; {tournament.max_players} player cap
              </p>
            </div>

            {/* ── Stat tiles — identical grid to admin ───────────────── */}
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
                value={tournament.prize_pool ? `$${tournament.prize_pool.toLocaleString()}` : "—"}
                accent="yellow"
              />
            </div>

            {/* ── Tabs — mirrors admin Players / Bracket / Stats tabs ── */}
            <Tabs defaultValue="bracket" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 bg-card/60 border border-border/40 h-9">
                <TabsTrigger value="bracket" className="text-xs gap-1.5">
                  <Swords className="h-3.5 w-3.5" />
                  Bracket
                </TabsTrigger>
                <TabsTrigger value="entrants" className="text-xs gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Entrants
                </TabsTrigger>
                <TabsTrigger value="info" className="text-xs gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Info
                </TabsTrigger>
              </TabsList>

              {/* Bracket tab */}
              <TabsContent value="bracket">
                <div className="rounded-xl border border-border/40 bg-card/40 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                    <div className="flex items-center gap-2">
                      <Swords className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">Live Bracket</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLive && (
                        <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-400 text-xs gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                          LIVE
                        </Badge>
                      )}
                      {matches.length > 0 && (
                        <span className="text-xs text-muted-foreground">{matches.length} matches</span>
                      )}
                    </div>
                  </div>

                  {hasBracket ? (
                    <div className="overflow-x-auto p-4">
                      <BracketDisplay />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center px-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/40 bg-card/60 mb-1">
                        <Swords className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-medium">Bracket not set yet</p>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        {tournament.status === "registration"
                          ? "Registration is open — the bracket will appear once players are seeded."
                          : "The bracket will appear here once the tournament goes live."}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Entrants tab */}
              <TabsContent value="entrants" className="space-y-4">
                <LiveEntries />
                <WinnersCircle />
              </TabsContent>

              {/* Info tab */}
              <TabsContent value="info">
                <HowToEnter minWager={0} requireActive={true} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      ) : (
        /* ── No active tournament ───────────────────────────────────── */
        <main className="min-h-[calc(100vh-64px)]">
          <div className="container mx-auto px-4 max-w-5xl py-10 space-y-6">
            {/* Hero */}
            <div className="rounded-xl border border-border/40 bg-card/40 p-8 flex flex-col items-center text-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border/40 bg-card/60">
                <Trophy className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">No Active Tournament</h1>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">
                  There&apos;s no tournament running right now. Follow R2K2 on Kick to be notified when the next one starts.
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
