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
import { Plus, ShoppingBag, Loader2, Check, X, RotateCcw, Trash2, Package, Infinity } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type ShopItem = {
  id: number
  name: string
  description: string | null
  points_cost: number
  active: boolean
  inventory: number | null
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

  const [newItem, setNewItem] = useState({ name: '', description: '', points_cost: '', inventory: '' })
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [processing, setProcessing] = useState<{ id: number; action: string } | null>(null)
  const [editingInventory, setEditingInventory] = useState<{ id: number; value: string } | null>(null)
  const [savingInventory, setSavingInventory] = useState(false)

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
          inventory: newItem.inventory === '' ? null : parseInt(newItem.inventory),
        }),
      })
      setNewItem({ name: '', description: '', points_cost: '', inventory: '' })
      setShowForm(false)
      mutateShop()
    } finally {
      setCreating(false)
    }
  }

  const saveInventory = async (id: number, value: string) => {
    setSavingInventory(true)
    const inventory = value === '' ? null : parseInt(value)
    await fetch(`/api/admin/shop/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inventory }),
    })
    setEditingInventory(null)
    setSavingInventory(false)
    mutateShop()
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
    setProcessing({ id, action: 'fulfill' })
    try {
      await fetch(`/api/admin/redemptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fulfill', status: 'fulfilled' }),
      })
      mutateRedemptions()
    } finally {
      setProcessing(null)
    }
  }

  const refund = async (id: number) => {
    setProcessing({ id, action: 'refund' })
    try {
      await fetch(`/api/admin/redemptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refund' }),
      })
      mutateRedemptions()
    } finally {
      setProcessing(null)
    }
  }

  const deleteRedemption = async (id: number) => {
    if (!confirm('Are you sure? This will permanently delete the redemption.')) return
    setProcessing({ id, action: 'delete' })
    try {
      await fetch(`/api/admin/redemptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete' }),
      })
      mutateRedemptions()
    } finally {
      setProcessing(null)
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
              <div className="grid grid-cols-3 gap-3">
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
                <div className="space-y-1.5">
                  <Label>Quantity (blank = unlimited)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newItem.inventory}
                    onChange={e => setNewItem(v => ({ ...v, inventory: e.target.value }))}
                    placeholder="e.g. 10"
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
              {items.map(item => {
                const isEditingThis = editingInventory?.id === item.id
                const outOfStock = item.inventory !== null && item.inventory <= 0
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 border border-border/40 rounded-lg gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.name}</p>
                      {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                      <p className="text-xs text-primary font-mono mt-0.5">{item.points_cost.toLocaleString()} pts</p>
                    </div>

                    {/* Inventory editor */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      {isEditingThis ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            className="h-7 w-20 text-xs px-2"
                            value={editingInventory.value}
                            onChange={e => setEditingInventory({ id: item.id, value: e.target.value })}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveInventory(item.id, editingInventory.value)
                              if (e.key === 'Escape') setEditingInventory(null)
                            }}
                            autoFocus
                            placeholder="∞"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            disabled={savingInventory}
                            onClick={() => saveInventory(item.id, editingInventory.value)}
                          >
                            {savingInventory ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-green-500" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => setEditingInventory(null)}
                          >
                            <X className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors min-w-[3rem] text-left"
                          onClick={() => setEditingInventory({ id: item.id, value: item.inventory === null ? '' : String(item.inventory) })}
                          title="Click to edit quantity"
                        >
                          {outOfStock ? (
                            <span className="text-destructive font-medium">Out of stock</span>
                          ) : item.inventory === null ? (
                            <span className="flex items-center gap-1"><Infinity className="h-3 w-3" /> Unlimited</span>
                          ) : (
                            <span>{item.inventory} left</span>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={outOfStock ? 'destructive' : item.active ? 'default' : 'secondary'} className="text-xs">
                        {outOfStock ? 'Out of Stock' : item.active ? 'Active' : 'Hidden'}
                      </Badge>
                      <Switch
                        checked={item.active}
                        onCheckedChange={v => toggleItem(item.id, v)}
                      />
                    </div>
                  </div>
                )
              })}
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
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => fulfill(r.id)}
                      disabled={processing?.id === r.id}
                      className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/30"
                      variant="outline"
                    >
                      {processing?.id === r.id && processing?.action === 'fulfill' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Fulfill
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => refund(r.id)}
                      disabled={processing?.id === r.id}
                      className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30"
                      variant="outline"
                    >
                      {processing?.id === r.id && processing?.action === 'refund' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Refund
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => deleteRedemption(r.id)}
                      disabled={processing?.id === r.id}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30"
                      variant="outline"
                    >
                      {processing?.id === r.id && processing?.action === 'delete' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
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
