import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generatePageMetadata('acebet')

export default function AcebetLeaderboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
