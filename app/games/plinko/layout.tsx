import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generatePageMetadata('gamesPlinko')

export default function PlinkoLayout({ children }: { children: React.ReactNode }) {
  return children
}
