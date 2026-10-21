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
  startDate: '2026-10-06',
  endDate: '2026-11-06',
  endISO: '2026-11-06T23:00:00Z',
}

/** Month label for the live period, matching how finished months are named below. */
export const CURRENT_LUXDROP_LABEL = 'October'

export interface LuxdropPastPeriod {
  label: string
  start_at: string
  end_at: string
  display: string
  rewards: number[]
  total: number
}

// Finished LuxDrop leaderboard months, newest first. The public leaderboard
// page's "Previous Leaderboards" dropdown and the account page's history
// selector both read this list so a month only has to be added once.
export const LUXDROP_PREVIOUS_PERIODS: LuxdropPastPeriod[] = [
  {
    label: 'September',
    start_at: '2026-09-05',
    end_at: '2026-10-06',
    display: 'Sep 6 – Oct 6, 2026',
    rewards: [600, 300, 180, 105, 75, 60, 60, 45, 45, 30],
    total: 1500,
  },
  {
    label: 'August',
    start_at: '2026-08-08',
    end_at: '2026-09-06',
    display: 'Aug 9 – Sep 6, 2026',
    rewards: [1000, 500, 300, 175, 125, 100, 100, 75, 75, 50],
    total: 2500,
  },
  {
    label: 'July',
    start_at: '2026-07-07',
    end_at: '2026-08-08',
    display: 'Jul 8 – Aug 8, 2026',
    rewards: [1000, 500, 300, 175, 125, 100, 100, 75, 75, 50],
    total: 2500,
  },
]
