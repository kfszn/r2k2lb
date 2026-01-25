import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { BracketProvider } from '@/lib/bracket-context'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'R2K2 - Exclusive Rewards & Leaderboards',
  description: '$5,000+ in monthly leaderboards plus exclusive rewards. Use code R2K2 on Acebet, Packdraw, and Clash.gg for bonuses, wager rewards, and more!',
  metadataBase: new URL('https://www.r2k2.gg'),
  openGraph: {
    title: 'R2K2 - Exclusive Rewards & Leaderboards',
    description: '$5,000+ in monthly leaderboards plus exclusive rewards with code R2K2',
    url: 'https://www.r2k2.gg',
    siteName: 'R2K2',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'R2K2 - Exclusive Rewards & Leaderboards',
    description: '$5,000+ in monthly leaderboards plus exclusive rewards',
  },
  icons: {
    icon: '/assets/logo.png',
    apple: '/assets/logo.png',
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <BracketProvider>
          {children}
        </BracketProvider>
        <Analytics />
      </body>
    </html>
  )
}
