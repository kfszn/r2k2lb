import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

// LuxDrop sponsor leaderboard — $2,500 prize pool (positions TBD)
export const metadata: Metadata = generatePageMetadata('luxdrop')

export default function LuxdropLeaderboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
