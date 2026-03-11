import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generatePageMetadata('signup')

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
