// Single source of truth for the LuxDrop monthly leaderboard's prize
// schedule. Both the leaderboard page and the account page's live
// leaderboard stat card read from here so the numbers never drift apart.
// Top 10 prize breakdown — $1,500 total pool:
// 1st $600 · 2nd $300 · 3rd $180 · 4th $105 · 5th $75
// 6th $60 · 7th $60 · 8th $45 · 9th $45 · 10th $30

export const LUXDROP_PRIZE_TOTAL = 1500
export const LUXDROP_REWARDS: number[] = [600, 300, 180, 105, 75, 60, 60, 45, 45, 30]

/** Prize amount for a given 1-indexed leaderboard rank, or 0 if outside paid positions. */
export function luxdropPrizeForRank(rank: number): number {
  return LUXDROP_REWARDS[rank - 1] ?? 0
}
