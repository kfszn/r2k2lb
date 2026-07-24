"use client";

import React from "react";
import { useState } from "react";
import { useActiveTournament } from "@/hooks/use-tournament-realtime";
import { Header } from "@/components/header";
import { GiveawayCounter } from "@/components/giveaway-counter";
import { QuickActions } from "@/components/admin/quick-actions";
import { TournamentStats } from "@/components/admin/tournament-stats";
import { MatchManager } from "@/components/admin/match-manager";
import { PlayerManager } from "@/components/admin/player-manager";
import { CreateTournamentDialog } from "@/components/admin/create-tournament-dialog";
import { EntrantsDialog } from "@/components/admin/entrants-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy, Users, Settings, Zap, Lock, Gamepad2, Ticket, ArrowRight, LineChart, ListOrdered, BarChart3 } from "lucide-react";
import Link from "next/link";
import { AdminNav, type AdminNavView } from "@/components/admin/admin-nav";
import { Input } from "@/components/ui/input";
import { ClaimsManager } from "@/components/admin/claims-manager";
import { WagerVerification } from "@/components/admin/wager-verification";
import { AllTournamentsManager } from "@/components/admin/all-tournaments-manager";
import { TournamentSelector } from "@/components/admin/tournament-selector";
import { TournamentDetailView } from "@/components/admin/tournament-detail-view";
import { StreamGamesManager } from "@/components/admin/stream-games-manager";
import { TotalWagerStats } from "@/components/admin/total-wager-stats";
import { RaffleManager } from "@/components/admin/raffle-manager";
import { ShopManager } from "@/components/admin/shop-manager";
import { UsersManager } from "@/components/admin/users-manager";
import { RewardsSettings } from "@/components/admin/rewards-settings";
import { GamesManager } from "@/components/admin/games-manager";
import { LeaderboardManager } from "@/components/admin/leaderboard-manager";
import { AcebetUserLookup } from "@/components/admin/acebet-user-lookup";
import { R2KoinsManager } from "@/components/admin/r2koins-manager";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";

type AdminView = "dashboard" | "tournament" | "website" | "tournament-detail" | "stream-games" | "raffle" | "shop" | "users" | "games" | "leaderboards" | "r2koins";

export default function AdminPage() {
  const [isAuthorized, setIsAuthorized] = useState(true); // TEMP: v0 preview bypass, revert before commit
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [currentView, setCurrentView] = useState<AdminView>("dashboard");
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const { tournament, isLoading, refresh } = useActiveTournament();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEntrantsDialog, setShowEntrantsDialog] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthorized(true);
      setPasswordError("");
    } else {
      setPasswordError("Incorrect password");
      setPasswordInput("");
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <GiveawayCounter />
        <Header />
        <div className="flex h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading admin panel...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-background">
        <GiveawayCounter />
        <Header />
        <div className="flex h-screen items-center justify-center px-4">
          <Card className="w-full max-w-md border-primary/20 bg-card/60 backdrop-blur-xl shadow-[0_0_60px_-20px_rgba(80,120,255,0.4)]">
            <CardHeader className="space-y-2 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
                  <Lock className="h-7 w-7 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Admin Access</CardTitle>
              <p className="text-sm text-muted-foreground">Enter the admin password to continue</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setPasswordError("");
                    }}
                    autoFocus
                  />
                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                  )}
                </div>
                <Button type="submit" className="w-full">
                  Unlock Admin Panel
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Dashboard View
  if (currentView === "dashboard") {
    const sections: {
      view?: AdminView;
      href?: string;
      title: string;
      description: string;
      icon: React.ReactNode;
    }[] = [
      { view: "tournament", title: "Tournament Management", description: "Create tournaments, manage matches, verify entries, and handle claims", icon: <Trophy className="h-6 w-6" /> },
      { view: "stream-games", title: "Stream Games", description: "Manage stream games and interactive content for viewers", icon: <Gamepad2 className="h-6 w-6" /> },
      { view: "raffle", title: "Weekly Raffle", description: "Configure raffle settings and select winners", icon: <Ticket className="h-6 w-6" /> },
      { view: "shop", title: "Rewards Shop", description: "Manage shop items, fulfill redemptions, and configure point settings", icon: <Settings className="h-6 w-6" /> },
      { view: "users", title: "Users", description: "View all users, adjust point balances, and manage accounts", icon: <Users className="h-6 w-6" /> },
      { view: "games", title: "Games Analytics", description: "View bet history, house profit, and per-game stats for Blackjack, Keno, and Plinko", icon: <BarChart3 className="h-6 w-6" /> },
      { view: "leaderboards", title: "Leaderboard Manager", description: "Create and manage leaderboards for AceBet and Kick with custom prize structures", icon: <ListOrdered className="h-6 w-6" /> },
      { href: "/admin/fifty-fifty", title: "50/50 Raffle", description: "Open rounds, view live stats, trigger draws, and review round history", icon: <Ticket className="h-6 w-6" /> },
      { view: "r2koins", title: "R2Koins", description: "Link platform accounts, manage conversion rates, and monitor wager-based coin awards", icon: <Zap className="h-6 w-6" /> },
      { view: "website", title: "Affiliate Analytics", description: "Verify individual wagers and view total affiliate statistics", icon: <LineChart className="h-6 w-6" /> },
    ];

    const cardInner = (s: (typeof sections)[number]) => (
      <div className="flex h-full flex-col gap-4 p-6">
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary transition-colors group-hover:border-primary/50 group-hover:bg-primary/20">
            {s.icon}
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-all group-hover:translate-x-1 group-hover:text-primary" />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-bold text-foreground">{s.title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{s.description}</p>
        </div>
      </div>
    );

    const cardClass =
      "group h-full cursor-pointer rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_12px_40px_-12px_rgba(80,120,255,0.35)]";

    return (
      <main className="min-h-screen bg-background">
        <GiveawayCounter />
        <Header />
        <div className="container mx-auto px-4 py-6">
          <AdminNav current="dashboard" onNavigate={(v) => setCurrentView(v as AdminView)} />
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Control Center</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sections.map((s) =>
              s.href ? (
                <Link key={s.title} href={s.href} className={cardClass}>
                  {cardInner(s)}
                </Link>
              ) : (
                <button key={s.title} onClick={() => setCurrentView(s.view!)} className={cardClass}>
                  {cardInner(s)}
                </button>
              )
            )}
          </div>
        </div>
      </main>
    );
  }

  // Tournament Management View - Show Tournament Selector
  if (currentView === "tournament") {
    return (
      <main className="min-h-screen bg-background">
        <GiveawayCounter />
        <Header />
        <div className="container mx-auto px-4 py-6">
          <AdminNav current="tournament" onNavigate={(v) => setCurrentView(v as AdminView)} />
          <h1 className="text-3xl font-bold tracking-tight mb-6">Tournament Management</h1>

          <TournamentSelector 
            onSelectTournament={(t) => {
              setSelectedTournament(t);
              setCurrentView("tournament-detail");
            }}
            onCreateNew={() => setShowCreateDialog(true)}
          />

          <CreateTournamentDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onCreated={refresh}
          />
        </div>
      </main>
    );
  }

  // Tournament Detail View
  if (currentView === "tournament-detail" && selectedTournament) {
    return (
      <main className="min-h-screen bg-background">
        <GiveawayCounter />
        <Header />
        <div className="container mx-auto px-4 py-6">
          <TournamentDetailView
            tournament={selectedTournament}
            onBack={() => {
              setSelectedTournament(null);
              setCurrentView("tournament");
            }}
          />
        </div>
      </main>
    );
  }

  // Stream Games View
  if (currentView === "stream-games") {
    return (
      <main className="min-h-screen bg-background">
        <GiveawayCounter />
        <Header />
        <div className="container mx-auto px-4 py-6">
          <AdminNav current="stream-games" onNavigate={(v) => setCurrentView(v as AdminView)} />
          <h1 className="text-3xl font-bold tracking-tight mb-6">Stream Games</h1>

          <StreamGamesManager />
        </div>
      </main>
    );
  }

  // Website Management View
  if (currentView === "website") {
    return (
      <main className="min-h-screen bg-background">
        <GiveawayCounter />
        <Header />
        <div className="container mx-auto px-4 py-6">
          <AdminNav current="website" onNavigate={(v) => setCurrentView(v as AdminView)} />
          <h1 className="text-3xl font-bold tracking-tight mb-6">Affiliate Analytics</h1>

          <Tabs defaultValue="wager" className="w-full">
            <TabsList className="grid w-full grid-cols-3 border border-border/40 bg-card/60 backdrop-blur-xl">
              <TabsTrigger value="wager" className="gap-2">
                <Zap className="h-4 w-4" />
                Individual Wager Verification
              </TabsTrigger>
              <TabsTrigger value="total-wager" className="gap-2">
                <Trophy className="h-4 w-4" />
                Total Statistics
              </TabsTrigger>
              <TabsTrigger value="user-info" className="gap-2">
                <Users className="h-4 w-4" />
                User Info
              </TabsTrigger>
            </TabsList>

            <TabsContent value="wager" className="mt-6">
              <WagerVerification />
            </TabsContent>

            <TabsContent value="total-wager" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    Total Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TotalWagerStats />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="user-info" className="mt-6">
              <AcebetUserLookup />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    );
  }

  // Rewards Shop View
  if (currentView === "shop") {
    return (
      <main className="min-h-screen bg-background">
        <GiveawayCounter />
        <Header />
        <div className="container mx-auto px-4 py-6">
          <AdminNav current="shop" onNavigate={(v) => setCurrentView(v as AdminView)} />
          <h1 className="text-3xl font-bold tracking-tight mb-6">Rewards Shop</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ShopManager />
            </div>
            <div>
              <RewardsSettings />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Users View
  if (currentView === "users") {
    return (
      <main className="min-h-screen bg-background">
        <GiveawayCounter />
        <Header />
        <div className="container mx-auto px-4 py-6">
          <AdminNav current="users" onNavigate={(v) => setCurrentView(v as AdminView)} />
          <h1 className="text-3xl font-bold tracking-tight mb-6">Users</h1>
          <UsersManager />
        </div>
      </main>
    );
  }

  // Games Analytics View
  if (currentView === "games") {
    return (
      <main className="min-h-screen bg-background">
        <GiveawayCounter />
        <Header />
        <div className="container mx-auto px-4 py-6">
          <AdminNav current="games" onNavigate={(v) => setCurrentView(v as AdminView)} />
          <h1 className="text-3xl font-bold tracking-tight mb-6">Games Analytics</h1>
          <GamesManager />
        </div>
      </main>
    );
  }

  // Leaderboard Manager View
  if (currentView === "leaderboards") {
    return (
      <main className="min-h-screen bg-background">
        <GiveawayCounter />
        <Header />
        <div className="container mx-auto px-4 py-6">
          <AdminNav current="leaderboards" onNavigate={(v) => setCurrentView(v as AdminView)} />
          <h1 className="text-3xl font-bold tracking-tight mb-6">Leaderboard Manager</h1>
          <LeaderboardManager />
        </div>
      </main>
    );
  }

  // R2Koins Management View
  if (currentView === "r2koins") {
    return (
      <main className="min-h-screen bg-background">
        <GiveawayCounter />
        <Header />
        <div className="container mx-auto px-4 py-6">
          <AdminNav current="r2koins" onNavigate={(v) => setCurrentView(v as AdminView)} />
          <h1 className="text-3xl font-bold tracking-tight mb-6">R2Koins Management</h1>
          <R2KoinsManager />
        </div>
      </main>
    );
  }

  // Raffle Management View
  if (currentView === "raffle") {
    return (
      <main className="min-h-screen bg-background">
        <GiveawayCounter />
        <Header />
        <div className="container mx-auto px-4 py-6">
          <AdminNav current="raffle" onNavigate={(v) => setCurrentView(v as AdminView)} />
          <h1 className="text-3xl font-bold tracking-tight mb-6">Weekly Raffle Management</h1>
          <RaffleManager />
        </div>
      </main>
    );
  }
}
