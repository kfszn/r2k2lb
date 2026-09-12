// Single source of truth for how Roobet leaderboard entries are named,
// weighted, and ordered. The public leaderboard page and any other place
// that needs a single player's rank (e.g. the account page's live stat
// card) MUST both go through this module — previously they duplicated this
// logic with slightly different inputs (rounded vs. unrounded wager values)
// and could disagree on placement for players with near-identical wagers.

export interface RoobetLeaderboardEntry {
  userId?: number | string
  id?: number | string
  username?: string
  name?: string
  wagered?: number
  weightedWagered?: number
  wagerAmount?: number
  totalWagered?: number
}

export function normalizeRoobetEntries(raw: unknown): RoobetLeaderboardEntry[] {
  if (Array.isArray(raw)) return raw as RoobetLeaderboardEntry[]
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    for (const key of ['data', 'affiliates', 'results', 'leaderboard', 'entries']) {
      if (Array.isArray(obj[key])) return obj[key] as RoobetLeaderboardEntry[]
    }
  }
  return []
}

export function getEntryName(e: RoobetLeaderboardEntry): string {
  return e.username ?? e.name ?? 'Unknown'
}

export function getEntryWagered(e: RoobetLeaderboardEntry): number {
  const weighted = Number(e.weightedWagered)
  if (Number.isFinite(weighted)) return weighted
  return Number(e.wagered ?? e.wagerAmount ?? e.totalWagered ?? 0) || 0
}

// Sort by weighted wager desc. Ties (down to fractional-cent differences)
// are broken deterministically by name so every consumer of this list —
// the public leaderboard table and a single player's rank lookup alike —
// always agrees on exact placement.
export function sortByWeightedWager<T extends RoobetLeaderboardEntry>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const diff = getEntryWagered(b) - getEntryWagered(a)
    if (diff !== 0) return diff
    return getEntryName(a).localeCompare(getEntryName(b))
  })
}

/** Returns the 1-based rank and entry for `username`, or null if not found. */
export function findRoobetRank<T extends RoobetLeaderboardEntry>(
  entries: T[],
  username: string
): { rank: number; entry: T } | null {
  const sorted = sortByWeightedWager(entries)
  const index = sorted.findIndex((e) => getEntryName(e).toLowerCase() === username.toLowerCase())
  if (index === -1) return null
  return { rank: index + 1, entry: sorted[index] }
}
