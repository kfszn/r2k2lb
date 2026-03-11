import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generatePageMetadata('raffle')

export default function RaffleLayout({ children }: { children: React.ReactNode }) {
  return children
}
