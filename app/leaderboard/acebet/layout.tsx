import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acebet Leaderboard',
  description: 'Compete on the Acebet leaderboard with code R2K2. Win $5,000+ in monthly prizes for top wagerers. Track rankings, earn rewards, and climb to the top.',
  keywords: ['Acebet leaderboard', 'Acebet rewards', 'Acebet code R2K2', 'Acebet bonus', 'gambling leaderboard', 'wager competition', 'monthly prizes'],
  openGraph: {
    title: 'Acebet Leaderboard',
    description: 'Compete on the Acebet leaderboard with code R2K2. Win $5,000+ in monthly prizes.',
    url: 'https://r2k2.gg/leaderboard/acebet',
    siteName: 'R2K2',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Acebet Leaderboard',
    description: 'Compete on the Acebet leaderboard and win $5,000+ monthly with code R2K2',
  },
  alternates: {
    canonical: 'https://r2k2.gg/leaderboard/acebet',
  },
}

export default function AcebetLeaderboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
