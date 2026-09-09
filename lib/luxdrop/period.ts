// Single source of truth for LuxDrop's current monthly leaderboard period
// boundaries. LuxDrop runs one leaderboard at a time (30 days, cutting over
// at 6:00 PM Eastern), unlike Roobet's rolling weekly periods. Both
// app/leaderboard/luxdrop/page.tsx and the account rewards API read from
// here so the leaderboard display and milestone-eligibility calculations
// never drift out of sync.

export interface LuxdropPeriod {
  /** Calendar date the period starts on (for display/labeling and as the wager-query start) */
  startDate: string
  /** Calendar date the period ends on (for display/labeling only) */
  endDate: string
  /** Exact UTC instant the period ends — drives the countdown and the wager-query end */
  endISO: string
}

export const CURRENT_LUXDROP_PERIOD: LuxdropPeriod = {
  startDate: '2026-09-05',
  endDate: '2026-10-06',
  endISO: '2026-10-06T22:00:00Z',
}
