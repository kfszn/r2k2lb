/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/home.html',
      },
      {
        source: '/leaderboard/acebet',
        destination: '/leaderboard-acebet.html',
      },
      {
        source: '/leaderboard/packdraw',
        destination: '/leaderboard-packdraw.html',
      },
      {
        source: '/raffle',
        destination: '/raffle.html',
      },
      {
        source: '/wagerbonus',
        destination: '/wagerbonus.html',
      },
    ]
  },
}

export default nextConfig
