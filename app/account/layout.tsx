import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generatePageMetadata('account')

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children
}
