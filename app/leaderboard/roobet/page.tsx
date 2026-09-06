import RoobetLeaderboardClient from './roobet-leaderboard-client'
import { getCurrentRoobetPeriod } from '@/lib/roobet/period'

// Compute the period once on the server and pass the serialized value into the
// client component. Computing it independently at module scope on both sides
// can cross a 6pm ET boundary between SSR and hydration and produce different
// text, which causes React hydration to fail.
export const dynamic = 'force-dynamic'

export default function RoobetLeaderboardPage() {
  return <RoobetLeaderboardClient initialPeriod={getCurrentRoobetPeriod()} />
}
