import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generatePageMetadata('gamesBlackjack')

export default function BlackjackLayout({ children }: { children: React.ReactNode }) {
  return children
}
