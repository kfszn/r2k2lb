import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kick Chatter Leaderboard | R2K2',
  description: 'Top Kick chatters ranked by points earned from messages and emotes.',
}

export default function KickLeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
