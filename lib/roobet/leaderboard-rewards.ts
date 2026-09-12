// Single source of truth for the Roobet weekly leaderboard's prize schedule.
// Both the archive cron (which posts leaderboard payouts to reward_claims)
// and the account page's live leaderboard stat card read from here so the
// numbers shown to a player while a period is live always match what they
// actually get paid once it's archived.

export const ROOBET_PRIZE_TOTAL = 5000
export const ROOBET_REWARDS: number[] = [2000, 1000, 600, 400, 300, 250, 200, 150, 75, 25]

/** Prize amount for a given 1-indexed leaderboard rank, or 0 if outside paid positions. */
export function roobetPrizeForRank(rank: number): number {
  return ROOBET_REWARDS[rank - 1] ?? 0
}
