"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, ShieldCheck, Trash2, KeyRound, Power } from "lucide-react"

interface StaffAccount {
  id: string
  username: string
  is_active: boolean
  created_at: string
  last_login_at: string | null
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function StaffAccountsManager() {
  const { data, mutate, isLoading } = useSWR<{ staff: StaffAccount[] }>("/api/admin/staff-accounts", fetcher)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [resetId, setResetId] = useState<string | null>(null)
  const [resetPassword, setResetPassword] = useState("")

  const staff = data?.staff ?? []

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/staff-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Failed to create staff account.")
        return
      }
      setUsername("")
      setPassword("")
      mutate()
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleActive(id: string, is_active: boolean) {
    await fetch(`/api/admin/staff-accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !is_active }),
    })
    mutate()
  }

  async function handleReset(id: string) {
    if (resetPassword.length < 8) {
      setError("New password must be at least 8 characters.")
      return
    }
    await fetch(`/api/admin/staff-accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPassword }),
    })
    setResetId(null)
    setResetPassword("")
    mutate()
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this staff login? They will no longer be able to sign in.")) return
    await fetch(`/api/admin/staff-accounts/${id}`, { method: "DELETE" })
    mutate()
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Create Staff Login
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Staff logins can only see the Rewards and Users sections. Inside Rewards they can add new claims and mark
            claim statuses (pending/approved/paid), but cannot edit or delete existing claims.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="staff-username">Username</Label>
              <Input
                id="staff-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. jordan"
                autoComplete="off"
                required
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="staff-password">Password</Label>
              <Input
                id="staff-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
            <Button type="submit" disabled={submitting} className="sm:w-auto">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Login"}
            </Button>
          </form>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-lg">Staff Logins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && staff.length === 0 && (
            <p className="text-sm text-muted-foreground">No staff logins yet.</p>
          )}
          {staff.map((s) => (
            <div
              key={s.id}
              className="flex flex-col gap-3 rounded-xl border border-border/40 bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{s.username}</span>
                  <Badge variant={s.is_active ? "default" : "secondary"}>
                    {s.is_active ? "Active" : "Disabled"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {s.last_login_at ? `Last login ${new Date(s.last_login_at).toLocaleString()}` : "Never logged in"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {resetId === s.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="New password"
                      className="h-8 w-40"
                      autoFocus
                    />
                    <Button size="sm" onClick={() => handleReset(s.id)}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setResetId(null)
                        setResetPassword("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setResetId(s.id)}>
                    <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                    Reset Password
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => toggleActive(s.id, s.is_active)}>
                  <Power className="mr-1.5 h-3.5 w-3.5" />
                  {s.is_active ? "Disable" : "Enable"}
                </Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDelete(s.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
