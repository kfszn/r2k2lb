// Single source of truth for Roobet's rolling weekly leaderboard period
// boundaries. The leaderboard cuts over at exactly 6:00 PM Eastern Time
// every 7 days — NOT at midnight UTC — so this module is DST-aware (it uses
// the IANA "America/New_York" rules via Intl, correctly shifting the UTC
// instant across EST/EDT transitions instead of assuming a fixed offset).
//
// Every consumer that needs "what period is live right now" or "what period
// just ended" MUST go through this module instead of re-deriving dates
// locally — duplicated copies of this logic previously drifted out of sync
// with each other (the leaderboard page and the milestones tracker disagreed
// on the current period's end date), which is exactly the kind of bug this
// module exists to prevent.

export const ROOBET_CUTOFF_HOUR_ET = 18 // 6:00 PM Eastern
export const ROOBET_PERIOD_DAYS = 7

// The instant the very first tracked period began (a literal UTC timestamp —
// it predates this 6pm-ET-cutover model, so it isn't itself aligned to 6pm
// ET; its ET calendar date is tracked separately below so the historical
// display label doesn't shift by a day when converted through the ET zone).
const FIRST_PERIOD_START_ISO = '2026-08-28T00:00:00.000Z'
const FIRST_PERIOD_START_DATE_ET = '2026-08-28'
// The ET calendar date the first period ends on, at ROOBET_CUTOFF_HOUR_ET.
// Every subsequent period is exactly ROOBET_PERIOD_DAYS later, also cutting
// over at ROOBET_CUTOFF_HOUR_ET ET.
const FIRST_PERIOD_END_DATE_ET = '2026-09-09'

export interface RoobetPeriod {
  /** ET calendar date the period starts on (for display/labeling only) */
  startDate: string
  /** ET calendar date the period ends on (for display/labeling only) */
  endDate: string
  /** Exact UTC instant the period begins — use this to query wager totals */
  startISO: string
  /** Exact UTC instant the period ends — use this to query wager totals and drive the countdown */
  endISO: string
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

// Returns the UTC offset (in minutes) that `timeZone` observes at `date` —
// e.g. -240 for EDT, -300 for EST. Works for any instant, so it automatically
// tracks DST transitions without a hardcoded schedule.
function getTimeZoneOffsetMinutes(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts = dtf.formatToParts(date)
  const map: Record<string, string> = {}
  for (const p of parts) map[p.type] = p.value
  const hour = map.hour === '24' ? '00' : map.hour
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(hour),
    Number(map.minute),
    Number(map.second)
  )
  return (asUTC - date.getTime()) / 60_000
}

// Returns the UTC instant corresponding to a given wall-clock hour:minute in
// America/New_York on the given ET calendar date — correctly accounting for
// EST/EDT.
function nyWallClockToUtc(dateStr: string, hour: number, minute = 0): Date {
  const naiveUtc = new Date(`${dateStr}T${pad(hour)}:${pad(minute)}:00.000Z`)
  const offsetMinutes = getTimeZoneOffsetMinutes('America/New_York', naiveUtc)
  return new Date(naiveUtc.getTime() - offsetMinutes * 60_000)
}

// Returns the ET calendar date (YYYY-MM-DD) a given UTC instant falls on.
function nyDateString(date: Date): string {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = dtf.formatToParts(date)
  const map: Record<string, string> = {}
  for (const p of parts) map[p.type] = p.value
  return `${map.year}-${map.month}-${map.day}`
}

export function addDaysToDateString(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function periodFromEndDate(startISO: string, endDateET: string): RoobetPeriod {
  const endISO = nyWallClockToUtc(endDateET, ROOBET_CUTOFF_HOUR_ET).toISOString()
  // Every start ISO except the very first one is itself an exact 6pm-ET
  // cutover instant, so its ET calendar date converts back cleanly. The
  // first period's start predates that model — use its fixed label instead.
  const startDate = startISO === FIRST_PERIOD_START_ISO ? FIRST_PERIOD_START_DATE_ET : nyDateString(new Date(startISO))
  return { startDate, endDate: endDateET, startISO, endISO }
}

/** The very first tracked period (fixed, historical — never changes). */
export function getFirstRoobetPeriod(): RoobetPeriod {
  return periodFromEndDate(FIRST_PERIOD_START_ISO, FIRST_PERIOD_END_DATE_ET)
}

/** The period in progress right now (start <= now < end). */
export function getCurrentRoobetPeriod(now: Date = new Date()): RoobetPeriod {
  let period = periodFromEndDate(FIRST_PERIOD_START_ISO, FIRST_PERIOD_END_DATE_ET)
  while (new Date(period.endISO).getTime() <= now.getTime()) {
    const nextEndDate = addDaysToDateString(period.endDate, ROOBET_PERIOD_DAYS)
    period = periodFromEndDate(period.endISO, nextEndDate)
  }
  return period
}

/** The most recently fully-completed period (end <= now), or null if the first period hasn't ended yet. */
export function getPreviousRoobetPeriod(now: Date = new Date()): RoobetPeriod | null {
  let period = periodFromEndDate(FIRST_PERIOD_START_ISO, FIRST_PERIOD_END_DATE_ET)
  if (new Date(period.endISO).getTime() > now.getTime()) return null

  for (;;) {
    const nextEndDate = addDaysToDateString(period.endDate, ROOBET_PERIOD_DAYS)
    const next = periodFromEndDate(period.endISO, nextEndDate)
    if (new Date(next.endISO).getTime() > now.getTime()) return period
    period = next
  }
}
