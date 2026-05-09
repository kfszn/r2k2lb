import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

// Packdraw leaderboard
export const metadata: Metadata = generatePageMetadata('packdraw')

export default function PackdrawLeaderboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
