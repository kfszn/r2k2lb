import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acebet Leaderboard | R2K2 - Win $7,000+ Monthly Rewards',
  description: 'Compete on the Acebet Leaderboard with code R2K2. $7,000+ in monthly prizes for top wagerers. Track rankings, earn rewards, and climb to the top. Join now!',
  keywords: ['Acebet leaderboard', 'Acebet rewards', 'Acebet code R2K2', 'Acebet bonus', 'gambling leaderboard', 'wager competition', 'monthly prizes'],
  openGraph: {
    title: 'Acebet Leaderboard | R2K2 - Win $7,000+ Monthly Rewards',
    description: 'Compete on the Acebet Leaderboard with code R2K2. $7,000+ in monthly prizes for top wagerers.',
    url: 'https://r2k2.gg/leaderboard/acebet',
    siteName: 'R2K2',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Acebet Leaderboard | R2K2',
    description: 'Compete on the Acebet Leaderboard and win $7,000+ monthly with code R2K2',
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
