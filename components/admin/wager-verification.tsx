"use client";

import { Fragment, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search, AlertCircle, Download, ChevronDown, ChevronRight } from "lucide-react";

interface LineItem {
  date: string;
  found: boolean;
  userId?: string | null;
  wagered: number;
  weightedWagered: number;
  favoriteGameId?: string | null;
  favoriteGameTitle?: string | null;
  rankLevel?: string | number | null;
  rankLevelImage?: string | null;
  highestMultiplier?: number | null;
  highestMultiplierGame?: string | null;
  // The complete, unmodified row Roobet's API returned for this day.
  raw?: Record<string, any> | null;
}

interface LineItemsResponse {
  ok: boolean;
  username: string;
  start: string;
  end: string;
  days: number;
  partialUpstreamError: boolean;
  totals: {
    wagered: number;
    weightedWagered: number;
    activeDays: number;
    highestMultiplier: number;
    highestMultiplierGame: string | null;
    highestMultiplierDate: string | null;
  };
  lineItems: LineItem[];
  error?: string;
  detail?: string;
}

function formatMoney(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatMultiplier(n?: number | null) {
  if (n == null) return "—";
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}x`;
}

// Flatten the raw Roobet row into label/value pairs, including nested objects
// (e.g. highestMultiplier.payout), so every field the API sends is shown.
function flattenRaw(obj: Record<string, any>, prefix = ""): [string, string][] {
  const pairs: [string, string][] = [];
  for (const [key, value] of Object.entries(obj)) {
    const label = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      pairs.push(...flattenRaw(value, label));
    } else {
      pairs.push([label, Array.isArray(value) ? JSON.stringify(value) : String(value)]);
    }
  }
  return pairs;
}

function RawFields({ raw }: { raw: Record<string, any> }) {
  const fields = flattenRaw(raw);
  return (
    <div className="px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        Every field Roobet's API returned for this day
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
        {fields.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-3 border-b border-border/40 py-1">
            <span className="font-mono text-[11px] text-muted-foreground break-all">{label}</span>
            <span className="font-mono text-[11px] text-foreground text-right break-all">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WagerVerification() {
  const [username, setUsername] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LineItemsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!username.trim()) {
      setError("Please enter a Roobet username");
      return;
    }
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    setError(null);
    setResult(null);
    setExpandedDate(null);
    setIsLoading(true);

    try {
      const url = `/api/roobet/wager-line-items?username=${encodeURIComponent(
        username.trim()
      )}&start=${startDate}&end=${endDate}`;

      const response = await fetch(url);
      const data: LineItemsResponse = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.detail || data.error || "Failed to fetch wager line items");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while fetching data");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleExportCsv = () => {
    if (!result) return;
    const header =
      "date,found,wagered,weightedWagered,favoriteGameTitle,rankLevel,highestMultiplier,highestMultiplierGame\n";
    const rows = result.lineItems
      .map(
        (item) =>
          `${item.date},${item.found},${item.wagered},${item.weightedWagered},"${
            item.favoriteGameTitle ?? ""
          }",${item.rankLevel ?? ""},${item.highestMultiplier ?? ""},"${
            item.highestMultiplierGame ?? ""
          }"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.username}_${result.start}_to_${result.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-primary/20 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Wager Verification
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Look up every daily line item Roobet's API returns for a player across a date range, for
          reward verification.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="username" className="text-sm font-medium">
              Roobet Username
            </Label>
            <Input
              id="username"
              placeholder="Enter Roobet username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="text-sm font-medium">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isLoading}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-sm font-medium">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isLoading}
                className="mt-1.5"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Roobet's API only returns one aggregate per query, so we query day-by-day across the
            range and show every day as its own line item. Max range: 92 days.
          </p>

          <Button onClick={handleSearch} disabled={isLoading} className="w-full gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching line items...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Get Line Items
              </>
            )}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="space-y-4">
            {result.partialUpstreamError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 flex gap-3">
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">
                  One or more days failed to load from Roobet's API — those days show as $0 / not
                  found below and may be incomplete.
                </p>
              </div>
            )}

            {/* Totals summary */}
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Wagered (raw)
                </p>
                <p className="text-xl font-bold text-foreground">{formatMoney(result.totals.wagered)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Weighted Wagered
                </p>
                <p className="text-xl font-bold text-primary">
                  {formatMoney(result.totals.weightedWagered)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Highest Multiplier
                </p>
                <p className="text-xl font-bold text-foreground">
                  {formatMultiplier(result.totals.highestMultiplier)}
                  {result.totals.highestMultiplierGame && (
                    <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                      {result.totals.highestMultiplierGame} · {result.totals.highestMultiplierDate}
                    </span>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Active Days
                </p>
                <p className="text-xl font-bold text-foreground">
                  {result.totals.activeDays} / {result.days}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Roobet's Affiliate Stats API doesn't return deposit or earnings data — only wagered
              amounts (raw and game-weighted), favorite game, rank level, and highest multiplier per
              day. These are exactly the fields the API sends.
            </p>

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {result.username} — {result.start} to {result.end} ({result.days} line items)
                <span className="block text-xs font-normal text-muted-foreground">
                  Tap any active day to see every field the API returned.
                </span>
              </p>
              <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>

            {/* Line items table */}
            <div className="rounded-lg border border-border max-h-[480px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Wagered (unweighted)</TableHead>
                    <TableHead className="text-right">Weighted Wagered</TableHead>
                    <TableHead>Most Played Game</TableHead>
                    <TableHead>Rank Level</TableHead>
                    <TableHead className="text-right">Highest Multiplier</TableHead>
                    <TableHead className="text-right">Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.lineItems.map((item) => {
                    const isExpanded = expandedDate === item.date;
                    return (
                      <Fragment key={item.date}>
                        <TableRow
                          className={`${!item.found ? "opacity-50" : ""} ${
                            item.found ? "cursor-pointer hover:bg-muted/40" : ""
                          }`}
                          onClick={() =>
                            item.found && setExpandedDate(isExpanded ? null : item.date)
                          }
                        >
                          <TableCell className="align-middle">
                            {item.found &&
                              (isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              ))}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{item.date}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatMoney(item.wagered)}
                          </TableCell>
                          <TableCell className="text-right text-primary font-medium">
                            {formatMoney(item.weightedWagered)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.favoriteGameTitle ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.rankLevel ?? "—"}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {formatMultiplier(item.highestMultiplier)}
                            {item.highestMultiplierGame && (
                              <span className="block text-muted-foreground">
                                {item.highestMultiplierGame}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {item.found ? "Active" : "No data"}
                          </TableCell>
                        </TableRow>
                        {isExpanded && item.raw && (
                          <TableRow className="bg-muted/20 hover:bg-muted/20">
                            <TableCell colSpan={8} className="p-0">
                              <RawFields raw={item.raw} />
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
