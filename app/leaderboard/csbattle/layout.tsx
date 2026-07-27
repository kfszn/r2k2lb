import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

// CsBattle sponsor leaderboard — 3,000 coin prize pool (top 10, top-3 heavy)
export const metadata: Metadata = generatePageMetadata('csbattle')

export default function CsBattleLeaderboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
