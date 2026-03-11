import type { Metadata } from 'next'

const baseUrl = 'https://r2k2.gg'
const brandName = 'R2K2'
const tagline = 'Exclusive Rewards & Leaderboards'

export const defaultMetadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: `${brandName} — $12,000 Monthly Leaderboards`,
    template: `%s | ${brandName}`,
  },
  description:
    '$12,000 in monthly leaderboards plus exclusive rewards. Use code R2K2 on Acebet and Packdraw for bonuses, loss back, tournaments, and more.',
  keywords: [
    'R2K2',
    'leaderboards',
    'rewards',
    'Acebet',
    'Packdraw',
    'wager rewards',
    'tournaments',
    'gambling affiliate',
    'code R2K2',
    'monthly prizes',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: brandName,
    title: `${brandName} — $12,000 Monthly Leaderboards`,
    description:
      '$12,000 in monthly leaderboards plus exclusive rewards. Use code R2K2 on Acebet and Packdraw.',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@r2ktwo',
    creator: '@r2ktwo',
    title: `${brandName} — $12,000 Monthly Leaderboards`,
    description: '$12,000 in monthly leaderboards plus exclusive rewards with code R2K2.',
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
    title: 'R2K2 — $12,000 Monthly Leaderboards on Acebet & Packdraw',
    description:
      'Compete on R2K2 leaderboards and win from a $12,000 monthly prize pool across Acebet and Packdraw. Use code R2K2 for exclusive bonuses, loss back, tournaments, and rewards.',
    keywords: [
      'R2K2',
      'leaderboard',
      'Acebet leaderboard',
      'Packdraw leaderboard',
      '$12000 monthly prizes',
      'exclusive code R2K2',
      'gambling rewards',
      'wager competition',
    ],
    canonical: baseUrl,
  },
  acebet: {
    title: 'Acebet Leaderboard — $10,000 Monthly with Code R2K2',
    description:
      'Compete on the R2K2 Acebet leaderboard for a share of $10,000 monthly. $5,000 bi-weekly leaderboards, VIP rewards, loss back, and more. Sign up with code R2K2.',
    keywords: [
      'Acebet leaderboard',
      'Acebet R2K2',
      'Acebet code R2K2',
      '$10000 monthly Acebet',
      'bi-weekly leaderboard',
      'Acebet wager rewards',
      'Acebet VIP',
    ],
    canonical: `${baseUrl}/leaderboard/acebet`,
  },
  packdraw: {
    title: 'Packdraw Leaderboard — Monthly Prizes with Code R2K2',
    description:
      'Compete on the R2K2 Packdraw leaderboard and win monthly prizes. 100% affiliate earnings back to your account, loss back, and first deposit bonus. Use code R2K2 on Packdraw.',
    keywords: [
      'Packdraw leaderboard',
      'Packdraw R2K2',
      'Packdraw code R2K2',
      'Packdraw affiliate earnings',
      'Packdraw monthly prizes',
      'Packdraw loss back',
    ],
    canonical: `${baseUrl}/leaderboard/packdraw`,
  },
  tournament: {
    title: 'Live Slot Bracket Tournaments — R2K2',
    description:
      'Join live slot bracket tournaments on R2K2. Real-time bracket battles, a winners circle, and exclusive cash prizes. Sign up and compete now.',
    keywords: [
      'slot tournament',
      'bracket tournament',
      'live slot competition',
      'R2K2 tournament',
      'slot bracket',
      'live prizes',
    ],
    canonical: `${baseUrl}/tournament`,
  },
  wagerRaces: {
    title: 'Wager Races — Milestone Rewards on R2K2',
    description:
      'Compete in R2K2 wager races on Acebet and Packdraw. Hit milestones to unlock exclusive cash rewards. Check active and upcoming races.',
    keywords: [
      'wager races',
      'milestone rewards',
      'Acebet wager race',
      'Packdraw wager race',
      'R2K2 races',
      'wager milestones',
    ],
    canonical: `${baseUrl}/wager-races`,
  },
  raffle: {
    title: 'R2K2 Raffle — Earn Tickets & Win Prizes',
    description:
      'Enter the R2K2 raffle using your points. Spin the wheel for a chance to win exclusive prizes. View past winners and upcoming draws.',
    keywords: [
      'R2K2 raffle',
      'raffle giveaway',
      'win prizes',
      'points raffle',
      'R2K2 giveaway',
      'raffle wheel',
    ],
    canonical: `${baseUrl}/raffle`,
  },
  shop: {
    title: 'Rewards Shop — Redeem R2K2 Points',
    description:
      'Spend your R2K2 points in the rewards shop. Redeem for cash, gift cards, and exclusive prizes. Earn points by watching streams and chatting.',
    keywords: [
      'R2K2 rewards shop',
      'redeem points',
      'points shop',
      'R2K2 points',
      'loyalty rewards',
    ],
    canonical: `${baseUrl}/shop`,
  },
  howItWorks: {
    title: 'How It Works — Earn & Spend R2K2 Points',
    description:
      'Learn how R2K2 Points work. Create an account, link your Kick username, earn points by watching streams, and redeem them in the rewards shop or enter raffles.',
    keywords: [
      'how R2K2 works',
      'earn points',
      'R2K2 points system',
      'Kick rewards',
      'stream points',
      'redeem rewards',
    ],
    canonical: `${baseUrl}/how-it-works`,
  },
  perksAcebetFirstDeposit: {
    title: 'Acebet First Deposit Bonus — Exclusive with Code R2K2',
    description:
      'Claim your first deposit bonus on Acebet with code R2K2. Exclusive welcome offer for new players. Find out the requirements and how to claim.',
    keywords: [
      'Acebet first deposit bonus',
      'Acebet welcome bonus',
      'Acebet new player',
      'Acebet code R2K2',
      'first deposit bonus',
    ],
    canonical: `${baseUrl}/perks/acebet/first-deposit`,
  },
  perksAcebetLossBack: {
    title: 'Acebet Loss Back — R2K2 Exclusive Cashback',
    description:
      'Get loss back on Acebet with R2K2 code. Recover a percentage of your losses automatically. Exclusive cashback benefit for R2K2 members.',
    keywords: [
      'Acebet loss back',
      'Acebet cashback',
      'Acebet R2K2 bonus',
      'gambling cashback',
      'loss recovery',
    ],
    canonical: `${baseUrl}/perks/acebet/loss-back`,
  },
  perksAcebetWagerRewards: {
    title: 'Acebet Wager Rewards — Monthly Tier Bonuses',
    description:
      'Earn tier-based monthly wager rewards on Acebet with code R2K2. The more you wager, the bigger your reward. Claim your monthly bonus.',
    keywords: [
      'Acebet wager rewards',
      'Acebet monthly bonus',
      'Acebet tier rewards',
      'wager bonus Acebet',
      'R2K2 Acebet rewards',
    ],
    canonical: `${baseUrl}/perks/acebet/wager-rewards`,
  },
  perksPackdrawFirstDeposit: {
    title: 'Packdraw First Deposit Bonus — Exclusive with Code R2K2',
    description:
      'Claim your first deposit bonus on Packdraw with code R2K2. Welcome reward for new Packdraw players signing up through R2K2.',
    keywords: [
      'Packdraw first deposit bonus',
      'Packdraw welcome bonus',
      'Packdraw new player',
      'Packdraw code R2K2',
      'Packdraw bonus',
    ],
    canonical: `${baseUrl}/perks/packdraw/first-time-deposit-bonus`,
  },
  perksPackdrawLossBack: {
    title: 'Packdraw Loss Back — R2K2 Exclusive Cashback',
    description:
      'Get daily loss back on Packdraw with R2K2 code. Recover a percentage of losses on case openings. Exclusive R2K2 member perk.',
    keywords: [
      'Packdraw loss back',
      'Packdraw cashback',
      'Packdraw R2K2 bonus',
      'case opening cashback',
      'loss recovery Packdraw',
    ],
    canonical: `${baseUrl}/perks/packdraw/loss-back`,
  },
  perksPackdrawWagerRewards: {
    title: 'Packdraw Affiliate Earnings — 100% Back with R2K2',
    description:
      'Wager bonuses are no longer available on Packdraw. Instead, 100% affiliate earnings are credited back to your account. Use code R2K2 on Packdraw.',
    keywords: [
      'Packdraw affiliate earnings',
      'Packdraw R2K2',
      'Packdraw rewards',
      'affiliate cashback',
    ],
    canonical: `${baseUrl}/perks/packdraw/wager-rewards`,
  },
  account: {
    title: 'My Account — R2K2 Dashboard',
    description:
      'Manage your R2K2 account. View your points balance, linked Kick username, redemption history, and leaderboard rankings.',
    keywords: [
      'R2K2 account',
      'R2K2 dashboard',
      'points balance',
      'linked Kick',
      'redemption history',
    ],
    canonical: `${baseUrl}/account`,
  },
  login: {
    title: 'Login — R2K2',
    description:
      'Log in to your R2K2 account to check your points, enter raffles, and manage your profile.',
    keywords: ['R2K2 login', 'sign in R2K2', 'R2K2 account'],
    canonical: `${baseUrl}/auth/login`,
  },
  signup: {
    title: 'Sign Up — Join R2K2 and Start Earning Points',
    description:
      'Create your free R2K2 account. Link your Kick username, earn points watching streams, and redeem them for cash prizes and rewards.',
    keywords: [
      'R2K2 sign up',
      'create R2K2 account',
      'join R2K2',
      'earn stream points',
      'R2K2 rewards',
    ],
    canonical: `${baseUrl}/auth/signup`,
  },
  wagerBonus: {
    title: 'Wager Bonus Info — R2K2 Rewards Program',
    description:
      'Understand the R2K2 wager bonus program across Acebet and Packdraw. Learn how wager-based rewards are earned and claimed.',
    keywords: [
      'wager bonus',
      'R2K2 wager rewards',
      'Acebet bonus',
      'Packdraw bonus',
      'betting rewards program',
    ],
    canonical: `${baseUrl}/wagerbonus`,
  },
  games: {
    title: 'Provably Fair Games — Play with R2K2 Points',
    description:
      'Play provably fair games on R2K2 using your points balance. Blackjack, Keno, Plinko and more. All results are verifiable on-chain.',
    keywords: [
      'R2K2 games',
      'provably fair',
      'play with points',
      'blackjack',
      'keno',
      'plinko',
      'R2K2 casino',
    ],
    canonical: `${baseUrl}/games`,
  },
  gamesBlackjack: {
    title: 'Blackjack — Provably Fair | R2K2',
    description:
      'Play provably fair Blackjack using R2K2 points. Fully verifiable results, instant payouts, and real-time gameplay.',
    keywords: [
      'R2K2 blackjack',
      'provably fair blackjack',
      'play blackjack points',
      'R2K2 games',
    ],
    canonical: `${baseUrl}/games/blackjack`,
  },
  gamesKeno: {
    title: 'Keno — Provably Fair | R2K2',
    description:
      'Play provably fair Keno using your R2K2 points. Pick your numbers, place your bet, and verify the results on-chain.',
    keywords: [
      'R2K2 keno',
      'provably fair keno',
      'play keno points',
      'R2K2 games',
    ],
    canonical: `${baseUrl}/games/keno`,
  },
  gamesPlinko: {
    title: 'Plinko — Provably Fair | R2K2',
    description:
      'Play provably fair Plinko using R2K2 points. Drop the ball and watch it bounce to your payout. Fully verifiable results.',
    keywords: [
      'R2K2 plinko',
      'provably fair plinko',
      'play plinko points',
      'R2K2 games',
    ],
    canonical: `${baseUrl}/games/plinko`,
  },
  gamesFairness: {
    title: 'Provably Fair Verification — R2K2 Games',
    description:
      'Verify the fairness of every R2K2 game result. Learn how our provably fair system works using server seeds, client seeds, and cryptographic hashing.',
    keywords: [
      'provably fair',
      'verify game results',
      'R2K2 fairness',
      'cryptographic fairness',
      'game verification',
    ],
    canonical: `${baseUrl}/games/fairness`,
  },
}

export function generatePageMetadata(pageKey: keyof typeof pageMetadata): Metadata {
  const pageMeta = pageMetadata[pageKey]

  return {
    title: pageMeta.title,
    description: pageMeta.description,
    keywords: pageMeta.keywords,
    alternates: {
      canonical: pageMeta.canonical,
    },
    openGraph: {
      title: pageMeta.title,
      description: pageMeta.description,
      url: pageMeta.canonical,
      siteName: 'R2K2',
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@r2ktwo',
      creator: '@r2ktwo',
      title: pageMeta.title,
      description: pageMeta.description,
    },
  }
}
