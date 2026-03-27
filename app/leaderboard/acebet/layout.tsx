import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

// Acebet on-site leaderboard — $10,000 prize pool: $7k top 5 / $3k bottom 5 (6-10)
export const metadata: Metadata = generatePageMetadata('acebet')

export default function AcebetLeaderboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
