/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'acebet.co',
      },
      {
        protocol: 'https',
        hostname: 'packdraw.com',
      },
    ],
  },
}

export default nextConfig
