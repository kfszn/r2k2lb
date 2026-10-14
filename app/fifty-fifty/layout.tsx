import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generatePageMetadata('fiftyFifty')

export default function FiftyFiftyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
