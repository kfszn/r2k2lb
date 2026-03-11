import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generatePageMetadata('tournament')

export default function TournamentLayout({ children }: { children: React.ReactNode }) {
  return children
}
