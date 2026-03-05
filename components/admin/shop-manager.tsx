'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Plus, ShoppingBag, Loader2, Check, X } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type ShopItem = {
  id: number
  name: string
  description: string | null
  points_cost: number
  active: boolean
}

type Redemption = {
  id: number
  order_id: string
  points_spent: number
  status: string
  created_at: string
  profiles?: { kick_username: string | null; email: string }
  shop_items?: { name: string }
}

export function ShopManager() {
  const { data: shopData, mutate: mutateShop } = useSWR<{ items: ShopItem[] }>('/api/admin/shop', fetcher)
  const { data: redemptionsData, mutate: mutateRedemptions } = useSWR<{ redemptions: Redemption[] }>('/api/admin/redemptions', fetcher)

  const [newItem, setNewItem] = useState({ name: '', description: '', points_cost: '' })
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [fulfilling, setFulfilling] = useState<number | null>(null)

  const createItem = async () => {
    if (!newItem.name || !newItem.points_cost) return
    setCreating(true)
    try {
      await fetch('/api/admin/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItem.name,
          description: newItem.description || null,
          points_cost: parseInt(newItem.points_cost),
        }),
      })
      setNewItem({ name: '', description: '', points_cost: '' })
      setShowForm(false)
      mutateShop()
    } finally {
      setCreating(false)
    }
  }

  const toggleItem = async (id: number, active: boolean) => {
    await fetch(`/api/admin/shop/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })
    mutateShop()
  }

  const fulfill = async (id: number) => {
    setFulfilling(id)
    try {
      await fetch(`/api/admin/redemptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'fulfilled' }),
      })
      mutateRedemptions()
    } finally {
      setFulfilling(null)
    }
  }

  const items = shopData?.items ?? []
  const redemptions = redemptionsData?.redemptions ?? []
  const pending = redemptions.filter(r => r.status === 'pending')
  const fulfilled = redemptions.filter(r => r.status === 'fulfilled')

  return (
    <div className="space-y-6">
      {/* Shop Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Shop Items
          </CardTitle>
          <Button size="sm" onClick={() => setShowForm(v => !v)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm && (
            <div className="border border-border/50 rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Item Name</Label>
                  <Input
                    value={newItem.name}
                    onChange={e => setNewItem(v => ({ ...v, name: e.target.value }))}
                    placeholder="e.g. $100 Tip"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Points Cost</Label>
                  <Input
                    type="number"
                    value={newItem.points_cost}
                    onChange={e => setNewItem(v => ({ ...v, points_cost: e.target.value }))}
                    placeholder="e.g. 60000"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description (optional)</Label>
                <Textarea
                  value={newItem.description}
                  onChange={e => setNewItem(v => ({ ...v, description: e.target.value }))}
                  placeholder="Brief description of this reward"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={createItem} disabled={creating || !newItem.name || !newItem.points_cost}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Item'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No shop items yet.</p>
          ) : (
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 border border-border/40 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                    <p className="text-xs text-primary font-mono mt-0.5">{item.points_cost.toLocaleString()} pts</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={item.active ? 'default' : 'secondary'} className="text-xs">
                      {item.active ? 'Active' : 'Hidden'}
                    </Badge>
                    <Switch
                      checked={item.active}
                      onCheckedChange={v => toggleItem(item.id, v)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Redemptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Pending Redemptions
            {pending.length > 0 && (
              <Badge variant="destructive" className="text-xs">{pending.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No pending redemptions.</p>
          ) : (
            <div className="space-y-2">
              {pending.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 border border-border/40 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{r.shop_items?.name ?? 'Unknown item'}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.profiles?.kick_username ?? r.profiles?.email ?? 'Unknown user'} &middot; {r.order_id} &middot; {r.points_spent.toLocaleString()} pts
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => fulfill(r.id)}
                    disabled={fulfilling === r.id}
                  >
                    {fulfilling === r.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Fulfill
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Fulfilled */}
      {fulfilled.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Recently Fulfilled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fulfilled.slice(0, 10).map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 border border-border/40 rounded-lg opacity-60">
                  <div>
                    <p className="text-sm font-medium">{r.shop_items?.name ?? 'Unknown item'}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.profiles?.kick_username ?? r.profiles?.email ?? 'Unknown'} &middot; {r.order_id}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Fulfilled
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
