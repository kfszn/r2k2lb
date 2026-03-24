import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

// Packdraw leaderboard — $2,000 prize pool: $800 / $500 / $350 / $250 / $100
export const metadata: Metadata = generatePageMetadata('packdraw')

export default function PackdrawLeaderboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
