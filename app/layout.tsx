import React from "react"
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { BracketProvider } from '@/lib/bracket-context'
import { defaultMetadata } from '@/lib/seo-metadata'
import Footer from '@/components/footer'
import FloatingBackground from '@/components/floating-background'
import PageLoader from '@/components/page-loader'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  ...defaultMetadata,
  generator: 'Next.js',
  applicationName: 'R2K2',
  manifest: '/manifest.webmanifest',
  keywords: ['r2k2', 'leaderboard', 'roobet', 'luxdrop', 'kick', 'r2koins', 'raffle', 'fifty fifty', 'slots', 'giveaway', 'wager', 'tournament', 'rewards shop', 'provably fair games'],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0e1a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased flex flex-col min-h-screen relative">
        <PageLoader />
        <FloatingBackground />
        <BracketProvider>
          {children}
        </BracketProvider>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
