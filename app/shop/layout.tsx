import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generatePageMetadata('shop')

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children
}
