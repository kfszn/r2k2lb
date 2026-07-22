"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Coins,
  Link2,
  Loader2,
  Pencil,
  Trash2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Plus,
  Minus,
  Search,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SiteUser {
  id: string;
  kick_username: string | null;
  email: string;
}

interface BalanceUser {
  id: string;
  kick_username: string | null;
  email: string;
  kick_avatar: string | null;
  balance: number;
  balance_updated_at: string | null;
}

interface PlatformRate {
  platform: string;
  coins_per_dollar: number;
  updated_at: string;
}

interface LinkedAccount {
  id: string;
  kick_user_id: string;
  platform: string;
  platform_username: string;
  discord_ticket_ref: string | null;
  initial_wager_baseline: number;
  linked_at: string;
  profiles: { kick_username: string | null; email: string } | null;
  wager_credits: {
    last_counted_wager: number;
    total_coins_awarded: number;
    last_synced_at: string | null;
  } | null;
}

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function R2KoinsManager() {
  return (
    <Tabs defaultValue="balances" className="space-y-6">
      <TabsList>
        <TabsTrigger value="balances" className="gap-2">
          <Wallet className="h-4 w-4" />
          Balances
        </TabsTrigger>
        <TabsTrigger value="links" className="gap-2">
          <Link2 className="h-4 w-4" />
          Links
        </TabsTrigger>
        <TabsTrigger value="rates" className="gap-2">
          <Coins className="h-4 w-4" />
          Rates
        </TabsTrigger>
      </TabsList>

      <TabsContent value="balances">
        <BalancesTab />
      </TabsContent>
      <TabsContent value="links">
        <LinksTab />
      </TabsContent>
      <TabsContent value="rates">
        <RatesTab />
      </TabsContent>
    </Tabs>
  );
}

/* ─────────────────────────── Balances ─────────────────────────── */

function BalancesTab() {
  const { data, mutate, isLoading } = useSWR<{ users: BalanceUser[] }>(
    "/api/admin/r2koins/balances",
    fetcher
  );
  const [search, setSearch] = useState("");

  // Adjust dialog state
  const [target, setTarget] = useState<BalanceUser | null>(null);
  const [mode, setMode] = useState<"add" | "set">("add");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const users = data?.users ?? [];
  const filtered = search.trim()
    ? users.filter(
        (u) =>
          (u.kick_username ?? "").toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const totalIssued = users.reduce((s, u) => s + u.balance, 0);
  const holders = users.filter((u) => u.balance > 0).length;

  const openAdjust = (u: BalanceUser, m: "add" | "set") => {
    setTarget(u);
    setMode(m);
    setAmount("");
    setError(null);
  };

  const submitAdjust = async () => {
    if (!target) return;
    const value = Number(amount);
    if (!Number.isFinite(value)) {
      setError("Enter a valid number");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/r2koins/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kick_user_id: target.id, amount: value, mode }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to adjust balance");
      } else {
        setTarget(null);
        mutate();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold">{users.length.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Coin Holders</p>
            <p className="text-2xl font-bold">{holders.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total R2Koins Issued</p>
            <p className="text-2xl font-bold text-primary">{fmt(totalIssued)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            All User Balances
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Every registered user and their R2Koins balance. Use Add or Set to manually adjust.
          </p>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Kick username or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {search.trim() ? "No users match your search." : "No users found."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="w-40 text-right">Adjust</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.kick_username ?? (
                          <span className="text-muted-foreground">(no kick)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                      <TableCell className="text-right font-mono font-semibold text-primary">
                        {fmt(u.balance)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1"
                            onClick={() => openAdjust(u, "add")}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1"
                            onClick={() => openAdjust(u, "set")}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Set
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjust dialog */}
      {target && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !saving && setTarget(null)}
        >
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {mode === "add" ? (
                  <Plus className="h-5 w-5 text-primary" />
                ) : (
                  <Pencil className="h-5 w-5 text-primary" />
                )}
                {mode === "add" ? "Add / Remove R2Koins" : "Set R2Koins Balance"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {target.kick_username ?? target.email} — current balance{" "}
                <span className="font-mono font-semibold text-foreground">{fmt(target.balance)}</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  {mode === "add"
                    ? "Amount to add (use a negative number to remove)"
                    : "New balance"}
                </Label>
                <Input
                  type="number"
                  step="any"
                  autoFocus
                  placeholder={mode === "add" ? "e.g. 500 or -100" : "e.g. 1000"}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) submitAdjust();
                  }}
                />
                {mode === "add" && Number.isFinite(Number(amount)) && amount.trim() !== "" && (
                  <p className="text-xs text-muted-foreground">
                    New balance will be{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {fmt(target.balance + Number(amount))}
                    </span>
                  </p>
                )}
              </div>

              {mode === "add" && (
                <div className="flex flex-wrap gap-2">
                  {[100, 500, 1000, 5000].map((q) => (
                    <Button
                      key={q}
                      size="sm"
                      variant="secondary"
                      onClick={() => setAmount(String(q))}
                    >
                      +{q.toLocaleString()}
                    </Button>
                  ))}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setTarget(null)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={submitAdjust} disabled={saving || amount.trim() === ""}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : mode === "add" ? (
                    "Apply"
                  ) : (
                    "Set Balance"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Links ─────────────────────────── */

function LinksTab() {
  const { data: linksData, mutate: mutateLinks } = useSWR<{ links: LinkedAccount[] }>(
    "/api/admin/r2koins/links",
    fetcher
  );
  const { data: ratesData } = useSWR<{ rates: PlatformRate[] }>(
    "/api/admin/r2koins/rates",
    fetcher
  );
  const { data: usersData } = useSWR<{ users: SiteUser[] }>("/api/admin/users", fetcher);

  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [platform, setPlatform] = useState("acebet");
  const [platformUsername, setPlatformUsername] = useState("");
  const [ticketRef, setTicketRef] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  const users = usersData?.users ?? [];
  const filteredUsers = userSearch.trim()
    ? users.filter(
        (u) =>
          (u.kick_username ?? "").toLowerCase().includes(userSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(userSearch.toLowerCase())
      )
    : [];

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const handleLink = async () => {
    if (!selectedUserId || !platformUsername.trim()) return;
    setLinkLoading(true);
    setLinkError(null);
    setLinkSuccess(null);
    try {
      const res = await fetch("/api/admin/r2koins/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kick_user_id: selectedUserId,
          platform,
          platform_username: platformUsername.trim(),
          discord_ticket_ref: ticketRef.trim() || null,
          linked_by_admin: "admin",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setLinkError(json.error ?? "Failed to create link");
      } else {
        setLinkSuccess(
          `Linked ${platformUsername} on ${platform} — baseline captured at $${Number(json.baseline).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
        );
        setSelectedUserId("");
        setUserSearch("");
        setPlatformUsername("");
        setTicketRef("");
        mutateLinks();
      }
    } catch {
      setLinkError("Network error. Please try again.");
    } finally {
      setLinkLoading(false);
    }
  };

  const handleUnlink = async (linkId: string, username: string) => {
    if (!confirm(`Remove the link for "${username}"? Their coin history is preserved but no further coins will accrue.`)) return;
    await fetch("/api/admin/r2koins/links", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ link_id: linkId }),
    });
    mutateLinks();
  };

  return (
    <div className="space-y-6">
      {/* Manual linking form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Link Platform Account
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Admin-only linking, prompted by a Discord ticket. The user&apos;s current lifetime wager is
            captured as a baseline so past wagering never earns coins.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Site User (search by Kick username or email)</Label>
            {selectedUser ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-sm font-medium">
                  {selectedUser.kick_username ?? selectedUser.email}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 ml-auto"
                  onClick={() => setSelectedUserId("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Start typing to search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                {filteredUsers.length > 0 && (
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                    {filteredUsers.slice(0, 8).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setSelectedUserId(u.id);
                          setUserSearch("");
                        }}
                      >
                        <span className="font-medium">{u.kick_username ?? "(no kick)"}</span>
                        <span className="text-muted-foreground ml-2">{u.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(ratesData?.rates ?? []).map((r) => (
                    <SelectItem key={r.platform} value={r.platform} className="capitalize">
                      {r.platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Platform Username</Label>
              <Input
                placeholder="Exact username on the platform"
                value={platformUsername}
                onChange={(e) => setPlatformUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Discord Ticket Ref (optional)</Label>
              <Input
                placeholder="e.g. ticket-0421"
                value={ticketRef}
                onChange={(e) => setTicketRef(e.target.value)}
              />
            </div>
          </div>

          {linkError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {linkError}
            </div>
          )}
          {linkSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-500">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {linkSuccess}
            </div>
          )}

          <Button
            onClick={handleLink}
            disabled={!selectedUserId || !platformUsername.trim() || linkLoading}
          >
            {linkLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Fetching baseline...
              </>
            ) : (
              "Create Link"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing links */}
      <Card>
        <CardHeader>
          <CardTitle>Linked Accounts ({linksData?.links?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!linksData ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : linksData.links.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No linked accounts yet. Create one above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Site User</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Platform Username</TableHead>
                    <TableHead className="text-right">Baseline</TableHead>
                    <TableHead className="text-right">Counted Wager</TableHead>
                    <TableHead className="text-right">Lifetime Coins</TableHead>
                    <TableHead>Last Synced</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linksData.links.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">
                        {link.profiles?.kick_username ?? link.profiles?.email ?? "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {link.platform}
                        </Badge>
                      </TableCell>
                      <TableCell>{link.platform_username}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        ${Number(link.initial_wager_baseline).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        ${Number(link.wager_credits?.last_counted_wager ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-primary">
                        {Number(link.wager_credits?.total_coins_awarded ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {link.wager_credits?.last_synced_at
                          ? new Date(link.wager_credits.last_synced_at).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleUnlink(link.id, link.platform_username)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─────────────────────────── Rates ─────────────────────────── */

function RatesTab() {
  const { data: ratesData, mutate: mutateRates } = useSWR<{ rates: PlatformRate[] }>(
    "/api/admin/r2koins/rates",
    fetcher
  );

  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [rateInput, setRateInput] = useState("");
  const [rateSaving, setRateSaving] = useState(false);

  const handleSaveRate = async (p: string) => {
    const value = Number(rateInput);
    if (!Number.isFinite(value) || value < 0) return;
    setRateSaving(true);
    await fetch("/api/admin/r2koins/rates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: p, coins_per_dollar: value }),
    });
    setRateSaving(false);
    setEditingRate(null);
    mutateRates();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Conversion Rates
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Coins awarded per $1 wagered. Changes apply on the next daily sync — no redeploy needed.
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Platform</TableHead>
              <TableHead>Coins per $1</TableHead>
              <TableHead>Example</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(ratesData?.rates ?? []).map((rate) => (
              <TableRow key={rate.platform}>
                <TableCell className="font-medium capitalize">{rate.platform}</TableCell>
                <TableCell>
                  {editingRate === rate.platform ? (
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      value={rateInput}
                      onChange={(e) => setRateInput(e.target.value)}
                      className="w-32 h-8"
                      autoFocus
                    />
                  ) : (
                    <span className="font-mono">{rate.coins_per_dollar}</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {Math.round(10000 * rate.coins_per_dollar).toLocaleString()} coins / $10,000
                </TableCell>
                <TableCell>
                  {editingRate === rate.platform ? (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        disabled={rateSaving}
                        onClick={() => handleSaveRate(rate.platform)}
                      >
                        {rateSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-500" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditingRate(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingRate(rate.platform);
                        setRateInput(String(rate.coins_per_dollar));
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
