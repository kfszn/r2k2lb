'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Trophy, Star, DollarSign, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PrizePosition {
  position: number
  amount: number
}

interface LeaderboardConfig {
  id: string
  name: string
  platform: 'acebet' | 'kick'
  start_date: string
  end_date: string
  is_active: boolean
  prize_positions: PrizePosition[]
  created_at: string
}

const PLATFORM_LABELS: Record<string, string> = {
  acebet: 'AceBet',
  kick: 'Kick',
}

const PLATFORM_COLORS: Record<string, string> = {
  acebet: 'bg-primary/20 border-primary/40 text-primary',
  kick: 'bg-green-500/20 border-green-500/40 text-green-400',
}

export function LeaderboardManager() {
  const supabase = createClient()
  const { toast } = useToast()

  const [configs, setConfigs] = useState<LeaderboardConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('all')

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    platform: 'kick' as 'acebet' | 'kick',
    start_date: '',
    end_date: '',
    is_active: false,
  })
  const [prizes, setPrizes] = useState<PrizePosition[]>([{ position: 1, amount: 0 }])
  const [isSaving, setIsSaving] = useState(false)

  const fetchConfigs = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('leaderboard_configs')
        .select('*')
        .order('start_date', { ascending: false })
      if (error) throw error
      setConfigs(data ?? [])
    } catch (err) {
      console.error('Error fetching leaderboard configs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchConfigs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalPayout = prizes.reduce((s, p) => s + (Number(p.amount) || 0), 0)

  const addPrizeRow = () => {
    const nextPos = prizes.length > 0 ? Math.max(...prizes.map(p => p.position)) + 1 : 1
    setPrizes(prev => [...prev, { position: nextPos, amount: 0 }])
  }

  const removePrizeRow = (i: number) => {
    setPrizes(prev => prev.filter((_, idx) => idx !== i))
  }

  const updatePrize = (i: number, field: keyof PrizePosition, value: number) => {
    setPrizes(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p))
  }

  const resetForm = () => {
    setForm({ name: '', platform: 'kick', start_date: '', end_date: '', is_active: false })
    setPrizes([{ position: 1, amount: 0 }])
  }

  const handleCreate = async () => {
    if (!form.name || !form.start_date || !form.end_date) {
      toast({ title: 'Missing fields', description: 'Name, start date, and end date are required.', variant: 'destructive' })
      return
    }

    setIsSaving(true)
    try {
      // If marking as active, deactivate others in same platform first
      if (form.is_active) {
        await supabase
          .from('leaderboard_configs')
          .update({ is_active: false })
          .eq('platform', form.platform)
      }

      const { error } = await supabase.from('leaderboard_configs').insert({
        name: form.name,
        platform: form.platform,
        start_date: form.start_date,
        end_date: form.end_date,
        is_active: form.is_active,
        prize_positions: prizes.sort((a, b) => a.position - b.position),
      })

      if (error) throw error

      toast({ title: 'Leaderboard created', description: `${form.name} has been created.` })
      setCreateOpen(false)
      resetForm()
      await fetchConfigs()
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create leaderboard.', variant: 'destructive' })
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetActive = async (config: LeaderboardConfig) => {
    try {
      // Deactivate all others in same platform
      await supabase
        .from('leaderboard_configs')
        .update({ is_active: false })
        .eq('platform', config.platform)

      // Activate this one
      await supabase
        .from('leaderboard_configs')
        .update({ is_active: true })
        .eq('id', config.id)

      toast({ title: 'Active leaderboard updated', description: `${config.name} is now active.` })
      await fetchConfigs()
    } catch {
      toast({ title: 'Error', description: 'Failed to update active status.', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      const { error } = await supabase.from('leaderboard_configs').delete().eq('id', id)
      if (error) throw error
      toast({ title: 'Deleted', description: `${name} has been removed.` })
      await fetchConfigs()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete leaderboard.', variant: 'destructive' })
    }
  }

  const filteredConfigs = activeTab === 'all'
    ? configs
    : configs.filter(c => c.platform === activeTab)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Leaderboard Manager</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage leaderboards for AceBet and Kick</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Leaderboard
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="kick">Kick</TabsTrigger>
          <TabsTrigger value="acebet">AceBet</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filteredConfigs.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-primary/20 rounded-xl text-muted-foreground">
              No leaderboards found. Create one to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredConfigs.map(cfg => {
                const payout = cfg.prize_positions.reduce((s, p) => s + p.amount, 0)
                return (
                  <Card key={cfg.id} className={`border ${cfg.is_active ? 'border-primary/40 bg-primary/5' : 'border-border/60'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-foreground">{cfg.name}</p>
                            <span className={`px-2 py-0.5 text-xs rounded-full border font-semibold ${PLATFORM_COLORS[cfg.platform]}`}>
                              {PLATFORM_LABELS[cfg.platform]}
                            </span>
                            {cfg.is_active && (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/40 border gap-1">
                                <Star className="h-3 w-3" /> Active
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {cfg.start_date} &mdash; {cfg.end_date}
                          </p>
                          {cfg.prize_positions.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {cfg.prize_positions.length} prize positions
                              </span>
                              <span className="text-xs font-semibold text-foreground">
                                ${payout.toLocaleString()} total
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!cfg.is_active && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetActive(cfg)}
                              className="gap-1.5 text-xs"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Set Active
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(cfg.id, cfg.name)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Modal */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Leaderboard</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Name</label>
              <Input
                placeholder="e.g. May 2026 Kick Leaderboard"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            {/* Platform + Active */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Platform</label>
                <Select
                  value={form.platform}
                  onValueChange={v => setForm(f => ({ ...f, platform: v as typeof form.platform }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kick">Kick</SelectItem>
                    <SelectItem value="acebet">AceBet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm font-medium">Set as Active</span>
                </label>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Start Date</label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">End Date</label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Prize Positions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-muted-foreground">Prize Positions</label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    Total: <span className="font-bold text-foreground">${totalPayout.toLocaleString()}</span>
                  </span>
                  <Button size="sm" variant="outline" onClick={addPrizeRow} className="h-7 gap-1 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {prizes.map((p, i) => (
                  <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
                    <span className="text-xs text-muted-foreground w-8 text-right">{i + 1}.</span>
                    <Input
                      type="number"
                      placeholder="Position"
                      value={p.position}
                      onChange={e => updatePrize(i, 'position', Number(e.target.value))}
                      className="h-8"
                      min={1}
                    />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={p.amount || ''}
                        onChange={e => updatePrize(i, 'amount', Number(e.target.value))}
                        className="h-8 pl-6"
                        min={0}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removePrizeRow(i)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isSaving} className="gap-2">
              <Trophy className="h-4 w-4" />
              {isSaving ? 'Creating...' : 'Create Leaderboard'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
