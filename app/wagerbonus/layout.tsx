import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generatePageMetadata('wagerBonus')

export default function WagerBonusLayout({ children }: { children: React.ReactNode }) {
  return children
}
