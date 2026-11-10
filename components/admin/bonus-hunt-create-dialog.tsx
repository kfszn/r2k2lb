'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CURRENCIES, CURRENCY_LABEL, type Currency } from '@/lib/hunt/currency'
import type { HuntSummary } from '@/lib/hunt/stats'
import { huntRequest } from '@/lib/hunt/use-bonus-hunt'

interface CreateHuntDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultCurrency: Currency
  onCreated: (hunt: HuntSummary) => void | Promise<void>
}

export function CreateHuntDialog({ open, onOpenChange, defaultCurrency, onCreated }: CreateHuntDialogProps) {
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState<Currency>(defaultCurrency)
  const [startBalance, setStartBalance] = useState('')
  const [number, setNumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) setCurrency(defaultCurrency)
  }, [open, defaultCurrency])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    const result = await huntRequest('POST', '/api/admin/bonus-hunt', {
      action: 'start',
      name,
      currency,
      startBalance,
      number: number || undefined,
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.error ?? 'Something went wrong.')
      return
    }
    setError(null)
    setName('')
    setStartBalance('')
    setNumber('')
    onOpenChange(false)
    const hunt = (result.data as { hunt?: HuntSummary } | undefined)?.hunt
    if (hunt) await onCreated(hunt)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Create hunt</DialogTitle>
            <DialogDescription>Starting a hunt turns on chat calls. Only one hunt can be live at a time.</DialogDescription>
          </DialogHeader>

          {error && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-foreground">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-hunt-name">Name (optional)</Label>
            <Input id="new-hunt-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Sunday max win hunt" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-hunt-currency">Currency</Label>
              <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
                <SelectTrigger id="new-hunt-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code} · {CURRENCY_LABEL[code]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-hunt-balance">Start balance</Label>
              <Input
                id="new-hunt-balance"
                value={startBalance}
                onChange={(e) => setStartBalance(e.target.value)}
                inputMode="decimal"
                placeholder="1000"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 sm:w-1/2">
            <Label htmlFor="new-hunt-number">Hunt # (optional)</Label>
            <Input id="new-hunt-number" value={number} onChange={(e) => setNumber(e.target.value)} inputMode="numeric" placeholder="Next number" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !startBalance.trim()}>
              Start hunt
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
