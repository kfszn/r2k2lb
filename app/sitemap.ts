import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://r2k2.gg'

  const routes = [
    {
      url: '/',
      changeFrequency: 'weekly' as const,
      priority: 1.0,
      lastModified: new Date(),
    },
    {
      url: '/leaderboard/acebet',
      changeFrequency: 'daily' as const,
      priority: 0.9,
      lastModified: new Date(),
    },
    {
      url: '/leaderboard/luxdrop',
      changeFrequency: 'daily' as const,
      priority: 0.9,
      lastModified: new Date(),
    },
    {
      url: '/wager-races',
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      lastModified: new Date(),
    },
    {
      url: '/raffle',
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      lastModified: new Date(),
    },
    {
      url: '/tournament',
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      lastModified: new Date(),
    },
    {
      url: '/leaderboard/kick',
      changeFrequency: 'daily' as const,
      priority: 0.9,
      lastModified: new Date(),
    },
    {
      url: '/fifty-fifty',
      changeFrequency: 'daily' as const,
      priority: 0.8,
      lastModified: new Date(),
    },
    {
      url: '/shop',
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      lastModified: new Date(),
    },
    {
      url: '/wagerbonus',
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      lastModified: new Date(),
    },
    // Acebet Perks
    {
      url: '/perks/acebet/first-deposit',
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      lastModified: new Date(),
    },
    {
      url: '/perks/acebet/loss-back',
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      lastModified: new Date(),
    },
    {
      url: '/perks/acebet/wager-rewards',
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      lastModified: new Date(),
    },
    {
      url: '/perks/acebet/reward-match',
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      lastModified: new Date(),
    },
    // Games
    {
      url: '/games',
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      lastModified: new Date(),
    },
    {
      url: '/games/blackjack',
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      lastModified: new Date(),
    },
    {
      url: '/games/keno',
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      lastModified: new Date(),
    },
    {
      url: '/games/plinko',
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      lastModified: new Date(),
    },
    {
      url: '/games/fairness',
      changeFrequency: 'monthly' as const,
      priority: 0.5,
      lastModified: new Date(),
    },
    {
      url: '/how-it-works',
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      lastModified: new Date(),
    },
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route.url}`,
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
