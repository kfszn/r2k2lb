import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generatePageMetadata('kick')

export default function KickLeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
