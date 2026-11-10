'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import { ArrowDown, ArrowUp, ImageIcon, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ENTRY_KINDS, type EntryKind, type EntryStatus, type HuntEntry } from '@/lib/hunt/stats'
import { huntRequest, useKnownSlots } from '@/lib/hunt/use-bonus-hunt'

const ENTRIES_URL = '/api/admin/bonus-hunt/entries'
const SLOTS_URL = '/api/admin/bonus-hunt/slots'

type Report = (error: string | null) => void

interface EntriesProps {
  entries: HuntEntry[]
  nextPosition: number | null
  huntId: string | null
  currency: string
  onRefresh: () => void
  onError: Report
}

export function KindSelect({
  value,
  onChange,
  className,
}: {
  value: EntryKind
  onChange: (kind: EntryKind) => void
  className?: string
}) {
  return (
    <Select value={value} onValueChange={(kind) => onChange(kind as EntryKind)}>
      <SelectTrigger aria-label="Bonus type" className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ENTRY_KINDS.map((kind) => (
          <SelectItem key={kind.value} value={kind.value}>
            {kind.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function KindBadge({ kind }: { kind: EntryKind }) {
  if (kind === 'regular') return null
  return (
    <span
      className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        kind === 'super' ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border bg-muted text-muted-foreground'
      }`}
    >
      {kind}
    </span>
  )
}

function Thumb({ entry }: { entry: HuntEntry }) {
  const [failed, setFailed] = useState(false)
  if (!entry.imageUrl || failed) {
    return (
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-bold uppercase text-muted-foreground">
        {entry.game.charAt(0)}
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={entry.imageUrl}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="size-10 shrink-0 rounded-md object-cover"
    />
  )
}

function ImageDialog({
  entry,
  open,
  onOpenChange,
  onSaved,
  onError,
}: {
  entry: HuntEntry
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  onError: Report
}) {
  const [url, setUrl] = useState(entry.imageUrl ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const result = await huntRequest('PUT', SLOTS_URL, { name: entry.game, imageUrl: url })
    setSaving(false)
    if (!result.ok) return onError(result.error ?? 'Could not save the image.')
    onError(null)
    await mutate(SLOTS_URL)
    onSaved()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Image for {entry.game}</DialogTitle>
          <DialogDescription>
            Paste an image link (https://). It is saved for this game, so every hunt and chat call that uses the same name shows it.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://…/slot-thumbnail.jpg"
          aria-label={`Image URL for ${entry.game}`}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : url.trim() ? 'Save image' : 'Remove image'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EntryRow({
  entry,
  index,
  total,
  isNext,
  currency,
  onMove,
  onRefresh,
  onError,
}: {
  currency: string
  entry: HuntEntry
  index: number
  total: number
  isNext: boolean
  onMove: (from: number, to: number) => void
  onRefresh: () => void
  onError: Report
}) {
  const [imageOpen, setImageOpen] = useState(false)

  async function patch(fields: Record<string, unknown>) {
    const result = await huntRequest('PATCH', ENTRIES_URL, { id: entry.id, ...fields })
    onError(result.ok ? null : (result.error ?? 'Could not save.'))
    onRefresh()
  }

  async function remove() {
    const result = await huntRequest('DELETE', `${ENTRIES_URL}?id=${entry.id}`)
    onError(result.ok ? null : (result.error ?? 'Could not delete.'))
    onRefresh()
  }

  // Saves when the field loses focus and the value actually changed.
  const commit =
    (field: 'game' | 'betSize' | 'payout', current: string) => (event: React.FocusEvent<HTMLInputElement>) => {
      const value = event.target.value.trim()
      if (value === current) return
      if (field === 'game' && !value) {
        event.target.value = current
        return
      }
      void patch({ [field]: field === 'payout' && value === '' ? null : value })
    }

  const onEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') event.currentTarget.blur()
  }

  const betText = entry.betSize > 0 ? String(entry.betSize) : ''
  const payoutText = entry.payout === null ? '' : String(entry.payout)

  return (
    <li
      className={`flex flex-col gap-2 rounded-lg border p-3 lg:flex-row lg:items-center ${
        isNext ? 'border-primary bg-primary/10' : 'border-border bg-card'
      }`}
    >
      <div className="flex items-center gap-3 lg:w-auto lg:flex-1">
        <span className="w-6 shrink-0 text-center text-sm font-semibold text-muted-foreground">{entry.position}</span>
        <button
          type="button"
          onClick={() => setImageOpen(true)}
          className="group relative shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Set image for ${entry.game}`}
        >
          <Thumb entry={entry} />
          <span className="absolute inset-0 flex items-center justify-center rounded-md bg-background/70 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <ImageIcon className="size-4" aria-hidden="true" />
          </span>
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Input
            key={`game-${entry.id}-${entry.game}`}
            defaultValue={entry.game}
            onBlur={commit('game', entry.game)}
            onKeyDown={onEnter}
            aria-label="Game name"
            maxLength={100}
          />
          {(entry.calledBy || isNext || entry.kind !== 'regular') && (
            <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
              <KindBadge kind={entry.kind} />
              {entry.calledBy ? `Called by ${entry.calledBy}` : ''}
              {entry.calledBy && isNext ? ' · ' : ''}
              {isNext ? 'Next to open' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:items-center">
        <Input
          key={`bet-${entry.id}-${entry.betSize}`}
          defaultValue={betText}
          onBlur={commit('betSize', betText)}
          onKeyDown={onEnter}
          inputMode="decimal"
          placeholder={`Bet ${currency}`}
          aria-label="Bet size"
          className="lg:w-24"
        />
        <Input
          key={`payout-${entry.id}-${entry.payout}`}
          defaultValue={payoutText}
          onBlur={commit('payout', payoutText)}
          onKeyDown={onEnter}
          inputMode="decimal"
          placeholder={`Payout ${currency}`}
          aria-label="Payout"
          className="lg:w-28"
        />
        <KindSelect value={entry.kind} onChange={(kind) => void patch({ kind })} className="lg:w-28" />
        <Select value={entry.status} onValueChange={(status: EntryStatus) => void patch({ status })}>
          <SelectTrigger aria-label="Status" className="lg:w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="called">Called</SelectItem>
            <SelectItem value="bought">Bought</SelectItem>
            <SelectItem value="opened">Opened</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1 self-end lg:self-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMove(index, index - 1)}
          disabled={index === 0}
          aria-label={`Move ${entry.game} up`}
        >
          <ArrowUp className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMove(index, index + 1)}
          disabled={index === total - 1}
          aria-label={`Move ${entry.game} down`}
        >
          <ArrowDown className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={remove} aria-label={`Delete ${entry.game}`}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>

      {imageOpen && (
        <ImageDialog entry={entry} open onOpenChange={setImageOpen} onSaved={onRefresh} onError={onError} />
      )}
    </li>
  )
}

function AddEntryForm({
  huntId,
  currency,
  onRefresh,
  onError,
}: Pick<EntriesProps, 'onRefresh' | 'onError' | 'currency'> & { huntId: string }) {
  const { data } = useKnownSlots()
  const [game, setGame] = useState('')
  const [bet, setBet] = useState('')
  const [payout, setPayout] = useState('')
  const [kind, setKind] = useState<EntryKind>('regular')
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    const result = await huntRequest('POST', ENTRIES_URL, { game, betSize: bet, payout, huntId, kind })
    setBusy(false)
    if (!result.ok) return onError(result.error ?? 'Could not add the bonus.')
    onError(null)
    setGame('')
    setBet('')
    setPayout('')
    onRefresh()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3 sm:flex-row">
      <Input
        value={game}
        onChange={(event) => setGame(event.target.value)}
        list="known-slots"
        placeholder="Add a game manually"
        aria-label="Game name"
        maxLength={100}
        className="sm:flex-1"
      />
      <datalist id="known-slots">
        {data?.slots.map((slot) => (
          <option key={slot.key} value={slot.name} />
        ))}
      </datalist>
      <Input
        value={bet}
        onChange={(event) => setBet(event.target.value)}
        inputMode="decimal"
        placeholder={`Bet ${currency}`}
        aria-label="Bet size"
        className="sm:w-28"
      />
      <Input
        value={payout}
        onChange={(event) => setPayout(event.target.value)}
        inputMode="decimal"
        placeholder={`Payout ${currency} (optional)`}
        aria-label="Payout"
        className="sm:w-40"
      />
      <KindSelect value={kind} onChange={setKind} className="sm:w-28" />
      <Button type="submit" disabled={busy || !game.trim()}>
        <Plus className="mr-1 size-4" aria-hidden="true" />
        Add
      </Button>
    </form>
  )
}

function PendingRow({
  entry,
  currency,
  onRefresh,
  onError,
}: {
  entry: HuntEntry
  currency: string
  onRefresh: () => void
  onError: Report
}) {
  const [bet, setBet] = useState(entry.betSize > 0 ? String(entry.betSize) : '')
  const [busy, setBusy] = useState(false)

  async function addToHunt() {
    setBusy(true)
    const result = await huntRequest('PATCH', ENTRIES_URL, {
      id: entry.id,
      pending: false,
      ...(bet.trim() ? { betSize: bet.trim() } : {}),
    })
    setBusy(false)
    onError(result.ok ? null : (result.error ?? 'Could not add to the hunt.'))
    onRefresh()
  }

  async function remove() {
    const result = await huntRequest('DELETE', `${ENTRIES_URL}?id=${entry.id}`)
    onError(result.ok ? null : (result.error ?? 'Could not delete.'))
    onRefresh()
  }

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Thumb entry={entry} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">{entry.game}</span>
          <span className="truncate text-xs text-muted-foreground">
            {entry.calledBy ? `Called by ${entry.calledBy}` : 'Pending call'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={bet}
          onChange={(event) => setBet(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && void addToHunt()}
          inputMode="decimal"
          placeholder={`Bet ${currency}`}
          aria-label={`Bet size for ${entry.game}`}
          className="w-28"
        />
        <Button onClick={addToHunt} disabled={busy}>
          <Plus className="mr-1 size-4" aria-hidden="true" />
          Add
        </Button>
        <Button variant="ghost" size="icon" onClick={remove} aria-label={`Dismiss ${entry.game}`}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </li>
  )
}

function PendingSection({
  pending,
  currency,
  onRefresh,
  onError,
}: {
  pending: HuntEntry[]
  currency: string
  onRefresh: () => void
  onError: Report
}) {
  const [busy, setBusy] = useState(false)

  async function addAll() {
    setBusy(true)
    for (const entry of pending) {
      const result = await huntRequest('PATCH', ENTRIES_URL, { id: entry.id, pending: false })
      if (!result.ok) {
        onError(result.error ?? 'Could not add every call.')
        break
      }
      onError(null)
    }
    setBusy(false)
    onRefresh()
  }

  return (
    <section aria-labelledby="pending-heading" className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 id="pending-heading" className="flex items-center gap-2 text-sm font-semibold text-foreground">
          Pending calls
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-primary">
            {pending.length}
          </span>
        </h3>
        {pending.length > 1 && (
          <Button variant="outline" size="sm" onClick={addAll} disabled={busy}>
            Add all
          </Button>
        )}
      </div>
      {pending.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-3 text-center text-sm text-muted-foreground">
          No pending calls. Chat calls wait here until you add them to the hunt.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {pending.map((entry) => (
            <PendingRow key={entry.id} entry={entry} currency={currency} onRefresh={onRefresh} onError={onError} />
          ))}
        </ul>
      )}
    </section>
  )
}

export function BonusHuntEntries({ entries, nextPosition, huntId, currency, onRefresh, onError }: EntriesProps) {
  const pending = entries.filter((entry) => entry.pending)
  const bonuses = entries.filter((entry) => !entry.pending)

  async function move(from: number, to: number) {
    if (to < 0 || to >= bonuses.length) return
    const ids = bonuses.map((entry) => entry.id)
    const [moved] = ids.splice(from, 1)
    ids.splice(to, 0, moved)
    const result = await huntRequest('PUT', ENTRIES_URL, { ids, huntId })
    onError(result.ok ? null : (result.error ?? 'Could not reorder.'))
    onRefresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <PendingSection pending={pending} currency={currency} onRefresh={onRefresh} onError={onError} />

      <section aria-labelledby="bonuses-heading" className="flex flex-col gap-2">
        <h3 id="bonuses-heading" className="flex items-center gap-2 text-sm font-semibold text-foreground">
          In the hunt
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
            {bonuses.length}
          </span>
        </h3>
        {huntId && <AddEntryForm huntId={huntId} currency={currency} onRefresh={onRefresh} onError={onError} />}
        {bonuses.length === 0 ? (
          <p className="rounded-lg border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            No bonuses yet. Add a pending call above, or add a game manually.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {bonuses.map((entry, index) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                index={index}
                total={bonuses.length}
                isNext={entry.position === nextPosition}
                currency={currency}
                onMove={move}
                onRefresh={onRefresh}
                onError={onError}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
