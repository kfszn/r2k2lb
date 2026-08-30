import RoobetLeaderboardClient from './roobet-leaderboard-client'

// This page computes the current leaderboard period from "today's" date at
// module scope. Without forcing dynamic rendering, Next.js would statically
// prerender it once at build time, freezing that date into the server HTML —
// which then mismatches whatever the client (correctly) computes at
// hydration time on a later day. Rendering on every request keeps the
// server and client in agreement.
export const dynamic = 'force-dynamic'

export default function RoobetLeaderboardPage() {
  return <RoobetLeaderboardClient />
}
