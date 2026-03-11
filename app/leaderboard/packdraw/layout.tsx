import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generatePageMetadata('packdraw')

export default function PackdrawLeaderboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
