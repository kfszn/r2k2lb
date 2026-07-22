import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { generatePageMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generatePageMetadata('games')

// LOCKED — games section is under active development.
// Remove this redirect when ready to re-enable.
export default function GamesLayout({ children }: { children: React.ReactNode }) {
  redirect('/')
}
