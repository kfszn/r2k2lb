import type { Metadata } from 'next'
import Link from 'next/link'
import { generatePageMetadata } from '@/lib/seo-metadata'

// Packdraw leaderboard
export const metadata: Metadata = generatePageMetadata('packdraw')

export default function PackdrawLeaderboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      {/* Leaderboard Navigation */}
      <div className="border-b border-border/50 sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-start gap-1">
            <Link
              href="/leaderboard/acebet"
              className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              AceBet
            </Link>
            <Link
              href="/leaderboard/packdraw"
              className="px-4 py-3 text-sm font-medium text-foreground border-b-2 border-primary"
            >
              Packdraw
            </Link>
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
