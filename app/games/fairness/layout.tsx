import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generatePageMetadata('gamesFairness')

export default function FairnessLayout({ children }: { children: React.ReactNode }) {
  return children
}
