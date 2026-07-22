'use client'

import { useCallback, useEffect, useState } from 'react'
import useSWR from 'swr'
import { Input } from '@/components/ui/input'
import { Loader2, Coins } from 'lucide-react'
import { BALANCE_KEY, refreshShell, formatKoins } from '@/components/games/game-shell'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())
const round2 = (n: number) => Math.round(n * 100) / 100

type Suit = 'S' | 'H' | 'D' | 'C'
type Card = { rank: number; suit: Suit }

type HandView = {
  cards: Card[]
  bet: number
  total: number
  soft: boolean
  done: boolean
  doubled: boolean
  surrendered: boolean
  splitAces: boolean
  outcome: 'win' | 'lose' | 'push' | 'blackjack' | null
  payout: number
}

type StateView = {
  dealer: Card[]
  dealerHoleShown: boolean
  dealerTotal: number | null
  hands: HandView[]
  active: number
  phase: 'player' | 'dealer' | 'done'
  insurance: number
  insuranceResolved: boolean
  baseBet: number
}

type Action = 'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'insurance' | 'decline_insurance'

const SUIT_CHAR: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' }
const RANK_CHAR: Record<number, string> = {
  1: 'A',
  11: 'J',
  12: 'Q',
  13: 'K',
}
function rankLabel(rank: number) {
  return RANK_CHAR[rank] ?? String(rank)
}

function PlayingCard({ card, hidden, index }: { card?: Card; hidden?: boolean; index: number }) {
  const red = card && (card.suit === 'H' || card.suit === 'D')
  return (
    <div
      className={cn(
        'relative w-14 h-20 md:w-16 md:h-24 rounded-lg border shadow-lg select-none animate-deal-in',
        hidden
          ? 'bg-gradient-to-br from-slate-700 to-slate-900 border-slate-600'
          : 'bg-gradient-to-br from-zinc-50 to-zinc-200 border-zinc-300',
      )}
      style={{ marginLeft: index > 0 ? '-1.5rem' : 0, animationDelay: `${index * 60}ms`, zIndex: index }}
    >
      {hidden ? (
        <div className="absolute inset-1.5 rounded border border-slate-500/40 bg-[repeating-linear-gradient(45deg,rgba(148,163,184,0.15)_0_6px,transparent_6px_12px)]" />
      ) : (
        card && (
          <>
            <div className={cn('absolute top-1 left-1.5 text-sm font-bold leading-none', red ? 'text-red-600' : 'text-zinc-900')}>
              <div>{rankLabel(card.rank)}</div>
              <div className="text-xs">{SUIT_CHAR[card.suit]}</div>
            </div>
            <div className={cn('absolute inset-0 flex items-center justify-center text-2xl', red ? 'text-red-600' : 'text-zinc-900')}>
              {SUIT_CHAR[card.suit]}
            </div>
            <div className={cn('absolute bottom-1 right-1.5 text-sm font-bold leading-none rotate-180', red ? 'text-red-600' : 'text-zinc-900')}>
              <div>{rankLabel(card.rank)}</div>
              <div className="text-xs">{SUIT_CHAR[card.suit]}</div>
            </div>
          </>
        )
      )}
    </div>
  )
}

const OUTCOME_LABEL: Record<string, string> = {
  win: 'WIN',
  lose: 'LOSE',
  push: 'PUSH',
  blackjack: 'BLACKJACK',
}
const OUTCOME_CLASS: Record<string, string> = {
  win: 'text-emerald-400 border-emerald-400/50 bg-emerald-500/10',
  lose: 'text-red-400 border-red-400/40 bg-red-500/10',
  push: 'text-muted-foreground border-border/50 bg-muted/20',
  blackjack: 'text-amber-400 border-amber-400/50 bg-amber-500/10',
}

export function BlackjackBoard() {
  const { data: balanceData } = useSWR(BALANCE_KEY, fetcher, { refreshInterval: 8000 })
  const balance = balanceData?.balance ?? 0

  const [betAmount, setBetAmount] = useState('10')
  const [handId, setHandId] = useState<string | null>(null)
  const [state, setState] = useState<StateView | null>(null)
  const [legal, setLegal] = useState<Action[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<{ payout: number; staked: number } | null>(null)

  const bet = Number(betAmount)

  // Resume an in-progress hand on mount.
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/games/v2/blackjack')
        const data = await res.json()
        if (data?.active) {
          setHandId(data.active.handId)
          setState(data.active.state)
          setLegal(data.active.legal ?? [])
        }
      } catch {
        /* ignore */
      }
    })()
  }, [])

  const deal = useCallback(async () => {
    setError(null)
    if (!Number.isFinite(bet) || bet < 1) {
      setError('Enter a valid bet amount')
      return
    }
    if (bet > balance) {
      setError('Insufficient R2Koins balance')
      return
    }
    setBusy(true)
    setLastResult(null)
    try {
      const res = await fetch('/api/games/v2/blackjack/deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bet: round2(bet) }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error === 'insufficient_funds' ? 'Insufficient R2Koins balance' : data.error ?? 'Deal failed')
        setBusy(false)
        return
      }
      setHandId(data.handId)
      setState(data.state)
      setLegal(data.legal ?? [])
      if (data.done) {
        finishRound(data)
      }
    } catch {
      setError('Network error')
    } finally {
      setBusy(false)
    }
  }, [bet, balance])

  const finishRound = (data: { payout: number; staked: number; balance: number }) => {
    setLastResult({ payout: data.payout, staked: data.staked })
    refreshShell('blackjack', data.balance)
  }

  const act = useCallback(
    async (action: Action) => {
      if (!handId) return
      setBusy(true)
      setError(null)
      try {
        const res = await fetch('/api/games/v2/blackjack/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handId, action }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error === 'insufficient_funds' ? 'Insufficient balance for that move' : data.error ?? 'Action failed')
          setBusy(false)
          return
        }
        setState(data.state)
        setLegal(data.legal ?? [])
        if (data.done) {
          finishRound(data)
          setHandId(null)
        }
      } catch {
        setError('Network error')
      } finally {
        setBusy(false)
      }
    },
    [handId],
  )

  const adjustBet = (fn: (n: number) => number) => {
    const next = round2(Math.max(1, fn(Number.isFinite(bet) ? bet : 0)))
    setBetAmount(String(next))
  }

  const inRound = state !== null && state.phase !== 'done'
  const showInsurance = legal.includes('insurance')

  const ACTION_BUTTONS: { action: Action; label: string; cls: string }[] = [
    { action: 'hit', label: 'Hit', cls: 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400' },
    { action: 'stand', label: 'Stand', cls: 'bg-red-500 text-red-950 hover:bg-red-400' },
    { action: 'double', label: 'Double', cls: 'bg-amber-500 text-amber-950 hover:bg-amber-400' },
    { action: 'split', label: 'Split', cls: 'bg-sky-500 text-sky-950 hover:bg-sky-400' },
    { action: 'surrender', label: 'Surrender', cls: 'bg-muted text-foreground hover:bg-muted/70 border border-border/60' },
  ]

  return (
    <div className="space-y-4">
      {/* Table */}
      <div
        className="relative rounded-2xl border border-border/50 overflow-hidden p-4 md:p-8 min-h-[420px] flex flex-col"
        style={{
          background:
            'radial-gradient(120% 120% at 50% 0%, oklch(0.28 0.06 155) 0%, oklch(0.19 0.04 155) 55%, oklch(0.14 0.03 155) 100%)',
        }}
      >
        {/* Dealer */}
        <div className="flex-1 flex flex-col items-center justify-start gap-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-200/70">
            Dealer
            {state?.dealerTotal != null && (
              <span className="rounded bg-black/30 px-2 py-0.5 font-bold text-white tabular-nums">
                {state.dealerTotal}
              </span>
            )}
          </div>
          <div className="flex items-center h-24">
            {state ? (
              <>
                {state.dealer.map((c, i) => (
                  <PlayingCard key={i} card={c} index={i} />
                ))}
                {!state.dealerHoleShown && <PlayingCard hidden index={state.dealer.length} />}
              </>
            ) : (
              <div className="text-emerald-200/40 text-sm">Waiting for bet…</div>
            )}
          </div>
        </div>

        {/* Center status */}
        <div className="flex items-center justify-center py-2 h-8">
          {lastResult && !inRound && (
            <div
              className={cn(
                'text-sm font-bold px-4 py-1 rounded-full border',
                lastResult.payout > lastResult.staked
                  ? 'text-emerald-400 border-emerald-400/50 bg-emerald-500/10'
                  : lastResult.payout === lastResult.staked
                    ? 'text-muted-foreground border-border/50 bg-muted/20'
                    : 'text-red-400 border-red-400/40 bg-red-500/10',
              )}
            >
              {lastResult.payout > lastResult.staked
                ? `+${formatKoins(lastResult.payout - lastResult.staked)} R2K`
                : lastResult.payout === lastResult.staked
                  ? 'Push'
                  : `${formatKoins(lastResult.payout - lastResult.staked)} R2K`}
            </div>
          )}
        </div>

        {/* Player hands */}
        <div className="flex-1 flex flex-wrap items-end justify-center gap-6">
          {state?.hands.map((hand, hi) => {
            const isActive = inRound && hi === state.active
            return (
              <div key={hi} className="flex flex-col items-center gap-2">
                <div className="flex items-center h-24">
                  {hand.cards.map((c, i) => (
                    <PlayingCard key={i} card={c} index={i} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded px-2 py-0.5 text-xs font-bold tabular-nums',
                      isActive ? 'bg-amber-400 text-amber-950' : 'bg-black/30 text-white',
                    )}
                  >
                    {hand.total}
                    {hand.soft && hand.total <= 21 ? ' (soft)' : ''}
                  </span>
                  {hand.outcome && (
                    <span className={cn('rounded border px-2 py-0.5 text-[10px] font-bold', OUTCOME_CLASS[hand.outcome])}>
                      {OUTCOME_LABEL[hand.outcome]}
                    </span>
                  )}
                  {state.hands.length > 1 && (
                    <span className="text-[10px] text-emerald-200/60">{formatKoins(hand.bet)} R2K</span>
                  )}
                </div>
              </div>
            )
          })}
          {!state && <div className="text-emerald-200/40 text-sm h-24 flex items-center">Your hand</div>}
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-2xl border border-border/50 bg-card/60 p-4 md:p-6 space-y-5">
        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* Insurance prompt */}
        {showInsurance && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
            <p className="text-sm text-amber-200">
              Dealer shows an Ace. Take insurance for {formatKoins(state!.baseBet / 2)} R2K? (pays 2:1 if dealer has blackjack)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => act('insurance')}
                disabled={busy}
                className="flex-1 h-11 rounded-xl bg-amber-500 text-sm font-bold text-amber-950 hover:bg-amber-400 disabled:opacity-60"
              >
                Insurance
              </button>
              <button
                onClick={() => act('decline_insurance')}
                disabled={busy}
                className="flex-1 h-11 rounded-xl border border-border/60 bg-muted/40 text-sm font-bold text-foreground hover:bg-muted disabled:opacity-60"
              >
                No Insurance
              </button>
            </div>
          </div>
        )}

        {/* In-round action buttons */}
        {inRound && !showInsurance && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {ACTION_BUTTONS.map((b) => {
              const enabled = legal.includes(b.action) && !busy
              return (
                <button
                  key={b.action}
                  onClick={() => act(b.action)}
                  disabled={!enabled}
                  className={cn(
                    'h-12 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30',
                    b.cls,
                  )}
                >
                  {b.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Bet + Deal (only when not in a round) */}
        {!inRound && (
          <>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Bet Amount (R2K)
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  min={1}
                  step="0.01"
                  disabled={busy}
                  className="tabular-nums font-semibold"
                />
                {[
                  { label: '½', fn: (n: number) => n / 2 },
                  { label: '2×', fn: (n: number) => n * 2 },
                ].map((b) => (
                  <button
                    key={b.label}
                    disabled={busy}
                    onClick={() => adjustBet(b.fn)}
                    className="shrink-0 rounded-md border border-border/60 bg-muted/40 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                  >
                    {b.label}
                  </button>
                ))}
                <button
                  disabled={busy}
                  onClick={() => setBetAmount(String(round2(balance)))}
                  className="shrink-0 rounded-md border border-border/60 bg-muted/40 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                >
                  Max
                </button>
              </div>
            </div>

            <button
              onClick={deal}
              disabled={busy}
              className="w-full h-14 rounded-xl bg-emerald-500 text-base font-bold text-emerald-950 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.6)] transition-all hover:bg-emerald-400 hover:shadow-[0_8px_36px_-6px_rgba(16,185,129,0.75)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Dealing…
                </>
              ) : (
                <>
                  <Coins className="h-5 w-5" /> Deal
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
