import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generatePageMetadata('login')

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
