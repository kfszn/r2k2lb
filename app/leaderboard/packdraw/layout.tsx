import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Packdraw Leaderboard | R2K2 - Win Monthly Rewards & Prizes',
  description: 'Compete on the Packdraw Leaderboard with code R2K2. Monthly prizes for top players. Track your ranking, earn exclusive rewards, and climb the leaderboard!',
  keywords: ['Packdraw leaderboard', 'Packdraw rewards', 'Packdraw code R2K2', 'Packdraw bonus', 'case opening leaderboard', 'monthly prizes', 'Packdraw competition'],
  openGraph: {
    title: 'Packdraw Leaderboard | R2K2 - Win Monthly Rewards & Prizes',
    description: 'Compete on the Packdraw Leaderboard with code R2K2. Monthly prizes for top players.',
    url: 'https://r2k2.gg/leaderboard/packdraw',
    siteName: 'R2K2',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Packdraw Leaderboard | R2K2',
    description: 'Compete on the Packdraw Leaderboard and win monthly rewards with code R2K2',
  },
  alternates: {
    canonical: 'https://r2k2.gg/leaderboard/packdraw',
  },
}

export default function PackdrawLeaderboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
