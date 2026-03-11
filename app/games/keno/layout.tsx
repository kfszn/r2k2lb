import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generatePageMetadata('gamesKeno')

export default function KenoLayout({ children }: { children: React.ReactNode }) {
  return children
}
