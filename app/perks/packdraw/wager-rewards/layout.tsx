import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generatePageMetadata('perksPackdrawWagerRewards')

export default function PackdrawWagerRewardsLayout({ children }: { children: React.ReactNode }) {
  return children
}
