import type { Metadata } from 'next'

const baseUrl = 'https://r2k2.gg'
const brandName = 'R2K2'
const tagline = 'Exclusive Rewards & Leaderboards'

export const defaultMetadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: `${brandName} - ${tagline}`,
    template: `%s | ${brandName}`,
  },
  description:
    '$5,000+ in monthly leaderboards plus exclusive rewards. Use code R2K2 on Acebet, Packdraw, and Clash.gg for bonuses, wager rewards, and more!',
  keywords: [
    'leaderboards',
    'rewards',
    'Acebet',
    'Packdraw',
    'Clash.gg',
    'wager rewards',
    'tournaments',
    'gambling',
    'betting',
    'code R2K2',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: brandName,
    title: `${brandName} - ${tagline}`,
    description:
      '$5,000+ in monthly leaderboards plus exclusive rewards with code R2K2',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@r2ktwo',
    creator: '@r2ktwo',
    title: `${brandName} - ${tagline}`,
    description: '$5,000+ in monthly leaderboards plus exclusive rewards',
  },
  icons: {
    icon: '/assets/logo.png',
    apple: '/assets/logo.png',
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
}

// Page-specific metadata
export const pageMetadata = {
  home: {
    title: 'Compete on R2K2 Leaderboards - $5,000+ Monthly Prizes',
    description:
      'Join exclusive leaderboard competitions with $5,000+ monthly prizes across Acebet, Packdraw, and Clash.gg. Use code R2K2 for bonuses and rewards.',
    keywords: [
      'leaderboard',
      'competition',
      'Acebet',
      'Packdraw',
      'Clash.gg',
      'wager rewards',
      'exclusive code',
      'monthly prizes',
    ],
  },
  acebet: {
    title: 'R2K2 Acebet Leaderboard - $3,000 Monthly Competition',
    description:
      'Compete on the R2K2 Acebet leaderboard with $3,000 in monthly prizes. Track wagers, deposits, and earnings in real-time. Use code R2K2 for bonuses.',
    keywords: [
      'Acebet leaderboard',
      'wager competition',
      'monthly prizes',
      'R2K2 code',
      'slot tournaments',
      'wager rewards',
    ],
  },
  packdraw: {
    title: 'R2K2 Packdraw Leaderboard - Monthly Wager Competition',
    description:
      'Join the R2K2 Packdraw leaderboard competition. Wager and earn rewards monthly. Rank up, earn bonuses, and get loss back with code R2K2.',
    keywords: [
      'Packdraw leaderboard',
      'wager competition',
      'rank up rewards',
      'loss back',
      'R2K2 code',
    ],
  },
  clash: {
    title: 'R2K2 Clash.gg Leaderboard - Coming Soon',
    description:
      'R2K2 is bringing exclusive rewards to Clash.gg. Leaderboard competitions coming soon. Use code R2K2 for access to rewards and tournaments.',
    keywords: [
      'Clash.gg',
      'leaderboard',
      'coming soon',
      'tournaments',
      'R2K2 code',
    ],
  },
  tournament: {
    title: 'Live Slot Bracket Tournaments - R2K2',
    description:
      'Compete in live slot bracket tournaments on R2K2. Real-time bracket battles, winners circle, and exclusive prizes. Join the action now!',
    keywords: [
      'tournament',
      'bracket',
      'slot tournament',
      'live competition',
      'prizes',
      'R2K2',
    ],
  },
  wagerRaces: {
    title: 'Wager Races - Milestone Rewards on R2K2',
    description:
      'Join wager races on Acebet and Packdraw. Reach milestones for exclusive rewards. Weekly and monthly wager race competitions with prize pools.',
    keywords: [
      'wager races',
      'milestones',
      'rewards',
      'Acebet',
      'Packdraw',
      'weekly',
      'monthly',
    ],
  },
  perksAcebetFirstDeposit: {
    title: 'First Time Deposit Bonus - Acebet with R2K2',
    description:
      'Claim your first time deposit bonus on Acebet using code R2K2. Exclusive welcome bonus for new players. Learn the requirements and rewards.',
    keywords: [
      'first deposit',
      'bonus',
      'Acebet',
      'welcome',
      'R2K2 code',
      'new players',
    ],
  },
  perksAcebetLossBack: {
    title: 'Loss Back Rewards - Acebet R2K2 Exclusive',
    description:
      'Get loss back rewards on Acebet with R2K2 code. Recover a percentage of your losses daily. Exclusive R2K2 member benefit.',
    keywords: [
      'loss back',
      'cashback',
      'Acebet',
      'rewards',
      'R2K2',
      'daily rewards',
    ],
  },
  perksAcebetWagerRewards: {
    title: 'Wager Rewards - Acebet Monthly Bonuses',
    description:
      'Earn monthly wager rewards on Acebet. Tier-based bonuses based on your betting volume. Higher wagers = bigger rewards with R2K2.',
    keywords: [
      'wager rewards',
      'monthly bonus',
      'tier rewards',
      'Acebet',
      'R2K2',
    ],
  },
  perksPackdrawFirstDeposit: {
    title: 'First Time Deposit Bonus - Packdraw with R2K2',
    description:
      'Unlock first time deposit bonuses on Packdraw using code R2K2. New player welcome package with exclusive perks.',
    keywords: [
      'first deposit',
      'bonus',
      'Packdraw',
      'welcome',
      'R2K2',
      'new players',
    ],
  },
  perksPackdrawLossBack: {
    title: 'Loss Back Rewards - Packdraw R2K2 Exclusive',
    description:
      'Get daily loss back on Packdraw with R2K2 code. Recovery percentage on your losses. Exclusive R2K2 member benefit on Packdraw.',
    keywords: [
      'loss back',
      'cashback',
      'Packdraw',
      'rewards',
      'R2K2',
      'daily',
    ],
  },
  perksPackdrawWelcomeBonus: {
    title: 'Welcome Bonus - Packdraw R2K2 Code',
    description:
      'Get your welcome bonus on Packdraw using R2K2 code. New member exclusive rewards and free play opportunities.',
    keywords: [
      'welcome bonus',
      'Packdraw',
      'new players',
      'free play',
      'R2K2',
    ],
  },
  perksPackdrawWagerRewards: {
    title: 'Wager Rewards - Packdraw Monthly Bonuses',
    description:
      'Earn wager-based rewards on Packdraw each month. Reward tiers based on betting volume. Maximize earnings with R2K2.',
    keywords: [
      'wager rewards',
      'monthly',
      'Packdraw',
      'tier rewards',
      'R2K2',
    ],
  },
  perksPackdrawLuckyDraw: {
    title: 'Lucky Draw Rewards - Packdraw Exclusive',
    description:
      'Enter the Packdraw lucky draw for a chance to win exclusive prizes. Weekly and monthly draws for R2K2 code members.',
    keywords: [
      'lucky draw',
      'raffle',
      'Packdraw',
      'prizes',
      'R2K2',
    ],
  },
  perksPackdrawSeasonalBonus: {
    title: 'Seasonal Bonus - Packdraw R2K2 Limited Time',
    description:
      'Claim seasonal bonuses on Packdraw during special events. Limited-time offers for R2K2 code users. Check for ongoing promotions.',
    keywords: [
      'seasonal bonus',
      'limited time',
      'Packdraw',
      'promotion',
      'R2K2',
    ],
  },
  raffle: {
    title: 'R2K2 Raffle - Win Exclusive Prizes',
    description:
      'Enter the R2K2 raffle for a chance to win big. Daily, weekly, and monthly draws. Previous winners and prize history available.',
    keywords: [
      'raffle',
      'giveaway',
      'prizes',
      'drawing',
      'winners',
      'R2K2',
    ],
  },
  account: {
    title: 'My Account - R2K2 Dashboard',
    description:
      'Manage your R2K2 account. View your profile, leaderboard rankings, rewards, and claimed perks in one dashboard.',
    keywords: [
      'account',
      'dashboard',
      'profile',
      'rewards',
      'leaderboard',
    ],
  },
  login: {
    title: 'Login - R2K2 Account',
    description: 'Log in to your R2K2 account to access leaderboards, track rewards, and manage your profile.',
    keywords: ['login', 'sign in', 'account', 'R2K2'],
  },
  signup: {
    title: 'Sign Up - Join R2K2 Leaderboards',
    description:
      'Create your R2K2 account to compete on leaderboards, earn rewards, and access exclusive bonuses with code R2K2.',
    keywords: [
      'sign up',
      'register',
      'create account',
      'join',
      'R2K2',
      'leaderboards',
    ],
  },
  wagerBonus: {
    title: 'Wager Bonus - R2K2 Rewards Program',
    description:
      'Learn about R2K2 wager bonuses. Earn rewards based on betting activity across Acebet and Packdraw. Maximize your bonus potential.',
    keywords: [
      'wager bonus',
      'betting rewards',
      'bonus program',
      'Acebet',
      'Packdraw',
      'R2K2',
    ],
  },
}

export function generatePageMetadata(pageKey: keyof typeof pageMetadata): Metadata {
  const pageMeta = pageMetadata[pageKey]

  return {
    title: pageMeta.title,
    description: pageMeta.description,
    keywords: pageMeta.keywords,
    openGraph: {
      title: pageMeta.title,
      description: pageMeta.description,
    },
    twitter: {
      title: pageMeta.title,
      description: pageMeta.description,
    },
  }
}
