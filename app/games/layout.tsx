import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generatePageMetadata('games')

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return children
}
