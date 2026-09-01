"use client";

import { useState } from "react";
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
import { Loader2, Search, AlertCircle, Download } from "lucide-react";

interface LineItem {
  date: string;
  found: boolean;
  userId?: string | null;
  wagered: number;
  deposited: number;
  earned: number;
  xp?: number;
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
    deposited: number;
    earned: number;
    activeDays: number;
  };
  lineItems: LineItem[];
  error?: string;
  detail?: string;
}

function formatMoney(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function WagerVerification() {
  const [username, setUsername] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LineItemsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    const header = "date,found,wagered,deposited,earned,xp\n";
    const rows = result.lineItems
      .map(
        (item) =>
          `${item.date},${item.found},${item.wagered},${item.deposited},${item.earned},${item.xp ?? 0}`
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
                  Total Wagered
                </p>
                <p className="text-xl font-bold text-primary">{formatMoney(result.totals.wagered)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Deposited
                </p>
                <p className="text-xl font-bold text-foreground">{formatMoney(result.totals.deposited)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Net Earnings
                </p>
                <p
                  className={`text-xl font-bold ${
                    result.totals.earned >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {formatMoney(result.totals.earned)}
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

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {result.username} — {result.start} to {result.end} ({result.days} line items)
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
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Wagered</TableHead>
                    <TableHead className="text-right">Deposited</TableHead>
                    <TableHead className="text-right">Earned</TableHead>
                    <TableHead className="text-right">Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.lineItems.map((item) => (
                    <TableRow key={item.date} className={!item.found ? "opacity-50" : undefined}>
                      <TableCell className="font-mono text-xs">{item.date}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(item.wagered)}
                      </TableCell>
                      <TableCell className="text-right">{formatMoney(item.deposited)}</TableCell>
                      <TableCell
                        className={`text-right ${
                          item.earned >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {formatMoney(item.earned)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {item.found ? "Active" : "No data"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
