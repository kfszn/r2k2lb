import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

// Acebet on-site leaderboard — $20,000 prize pool: $14k top 5 / $6k bottom 5 (6-10)
export const metadata: Metadata = generatePageMetadata('acebet')

export default function AcebetLeaderboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
