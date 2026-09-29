"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw } from "lucide-react";

interface ClaimEntry {
  username: string;
  rank: number;
  amount?: number;
  reason?: string;
}

interface PeriodResult {
  label: string;
  created: ClaimEntry[];
  skipped: ClaimEntry[];
}

/**
 * Re-runs leaderboard reward-claim creation for archived Roobet periods and
 * posts any missing reward claims for paid ranks — a repair tool for
 * periods that predate always-post-by-username, or that otherwise ended up
 * with a gap. Safe to run repeatedly — existing claims are never
 * duplicated.
 */
export function RoobetBackfillClaimsAction() {
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PeriodResult[] | null>(null);

  const handleBackfill = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/admin/roobet/backfill-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to backfill claims");
      setResults(json.results);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to backfill claims");
    } finally {
      setLoading(false);
    }
  };

  const totalCreated = results?.reduce((sum, r) => sum + r.created.length, 0) ?? 0;

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-primary" />
          Backfill Leaderboard Claims
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Re-checks archived Roobet leaderboard periods and posts any missing reward claims for paid
          ranks, keyed by username — a player doesn&apos;t need a linked account yet to be owed a
          claim, since claims automatically surface once they link that username. Never duplicates
          existing claims.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Period Label (optional)</Label>
          <Input
            placeholder='e.g. "September IV" — leave blank to check every archived period'
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
        )}

        <Button onClick={handleBackfill} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1.5" />
          )}
          Run Backfill
        </Button>

        {results && (
          <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-3 text-sm">
            <p className="font-semibold text-emerald-400">
              {totalCreated} new reward claim(s) posted across {results.length} period(s)
            </p>
            {results.map((r) => (
              <div key={r.label} className="space-y-1">
                <p className="font-medium text-foreground">{r.label}</p>
                {r.created.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nothing new — all paid ranks already have claims.</p>
                ) : (
                  r.created.map((c) => (
                    <p key={c.username} className="text-muted-foreground text-xs">
                      #{c.rank} {c.username} — ${c.amount?.toLocaleString()}
                    </p>
                  ))
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
