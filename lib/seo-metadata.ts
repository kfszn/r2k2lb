import type { Metadata } from 'next'

// Updated July 2026: multi-platform leaderboards (Acebet + LuxDrop + Kick), R2Koins, 50/50, raffle, shop, games
const baseUrl = 'https://r2k2.gg'
const brandName = 'R2K2'

export const defaultMetadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: `${brandName} — Leaderboards, Rewards & Exclusive Perks`,
    template: `%s | ${brandName}`,
  },
  description:
    'R2K2 is a multi-platform rewards community. Compete on Acebet, LuxDrop, and Kick leaderboards, earn R2Koins from wagers, play 50/50 draws, enter raffles, and redeem points in the shop.',
  keywords: [
    'R2K2',
    'leaderboards',
    'rewards',
    'Acebet',
    'LuxDrop',
    'Kick leaderboard',
    'wager rewards',
    'R2Koins',
    'tournaments',
    'raffle',
    'rewards shop',
    'fifty fifty',
    'gambling affiliate',
    'code R2K2',
    'monthly prizes',
    'provably fair games',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: brandName,
    title: `${brandName} — Leaderboards, Rewards & Exclusive Perks`,
    description:
      'Compete on Acebet, LuxDrop, and Kick leaderboards, earn R2Koins, play 50/50 draws, enter raffles, and redeem points. Use code R2K2.',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@r2ktwo',
    creator: '@r2ktwo',
    title: `${brandName} — Leaderboards, Rewards & Exclusive Perks`,
    description:
      'Compete on Acebet, LuxDrop & Kick leaderboards. Earn R2Koins, play 50/50, enter raffles, redeem points. Code R2K2.',
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
    title: 'R2K2 — Leaderboards, R2Koins, Raffles & Exclusive Perks',
    description:
      'R2K2 is your hub for multi-platform leaderboard competitions on Acebet, LuxDrop, and Kick. Earn R2Koins from wagers, play 50/50 draws, enter raffles, redeem points, and compete in tournaments. Use code R2K2.',
    keywords: [
      'R2K2',
      'leaderboard',
      'Acebet leaderboard',
      'LuxDrop leaderboard',
      'Kick leaderboard',
      'R2Koins',
      'fifty fifty',
      'raffle',
      'rewards shop',
      'exclusive code R2K2',
      'gambling rewards',
      'wager competition',
    ],
    canonical: baseUrl,
  },
  acebet: {
    title: 'Acebet Leaderboard — Monthly Prizes with Code R2K2',
    description:
      'Compete on the R2K2 Acebet leaderboard for monthly cash prizes. Earn R2Koins on every wager, claim loss back, unlock tier rewards, and more. Sign up with code R2K2.',
    keywords: [
      'Acebet leaderboard',
      'Acebet R2K2',
      'Acebet code R2K2',
      'Acebet monthly prizes',
      'Acebet wager rewards',
      'Acebet VIP',
      'R2Koins Acebet',
    ],
    canonical: `${baseUrl}/leaderboard/acebet`,
  },
  luxdrop: {
    title: 'LuxDrop Leaderboard — Monthly Prizes with Code R2K2',
    description:
      'Compete on the R2K2 LuxDrop leaderboard for monthly cash prizes. Use code R2K2 on LuxDrop and every wager counts toward your placement and R2Koins balance.',
    keywords: [
      'LuxDrop leaderboard',
      'LuxDrop R2K2',
      'LuxDrop code R2K2',
      'LuxDrop monthly prizes',
      'LuxDrop rewards',
      'LuxDrop wager competition',
      'R2Koins LuxDrop',
    ],
    canonical: `${baseUrl}/leaderboard/luxdrop`,
  },
  kick: {
    title: 'Kick Leaderboard — Top Chatters & Subscribers | R2K2',
    description:
      'See the top Kick chatters and subscribers on the R2K2 Kick leaderboard. Earn points by watching and chatting live, then redeem them in the rewards shop.',
    keywords: [
      'Kick leaderboard',
      'R2K2 Kick',
      'Kick chatters',
      'Kick subscribers',
      'Kick stream rewards',
      'R2K2 Kick points',
    ],
    canonical: `${baseUrl}/leaderboard/kick`,
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
      'Compete in R2K2 wager races on Acebet. Hit milestones to unlock exclusive cash rewards. Check active and upcoming races.',
    keywords: [
      'wager races',
      'milestone rewards',
      'Acebet wager race',
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
  fiftyFifty: {
    title: '50/50 Draw — Buy Tickets & Win | R2K2',
    description:
      'Enter the R2K2 50/50 draw using your points. Buy tickets for a chance to win half the pot. A new draw runs every round — the more tickets you hold, the better your odds.',
    keywords: [
      'R2K2 fifty fifty',
      '50/50 draw',
      'R2K2 raffle draw',
      'win half the pot',
      'points draw',
      'R2K2 50 50',
    ],
    canonical: `${baseUrl}/fifty-fifty`,
  },
  perksAcebetRewardMatch: {
    title: 'Acebet Reward Match — Double Your Deposit | R2K2',
    description:
      'Get your Acebet deposit matched as a bonus with code R2K2. Exclusive reward match offer for R2K2 members. Learn how to claim and the requirements.',
    keywords: [
      'Acebet reward match',
      'Acebet deposit match',
      'Acebet bonus match',
      'Acebet code R2K2',
      'deposit bonus',
      'reward match offer',
    ],
    canonical: `${baseUrl}/perks/acebet/reward-match`,
  },
  wagerBonus: {
    title: 'Wager Bonus Info — R2K2 Rewards Program',
    description:
      'Understand the R2K2 wager bonus program on Acebet. Learn how wager-based rewards are earned and claimed.',
    keywords: [
      'wager bonus',
      'R2K2 wager rewards',
      'Acebet bonus',
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
