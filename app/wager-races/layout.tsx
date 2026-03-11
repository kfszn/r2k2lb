import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generatePageMetadata('wagerRaces')

export default function WagerRacesLayout({ children }: { children: React.ReactNode }) {
  return children
}
