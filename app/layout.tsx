import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'R2K2 Tournaments - Live Slot Bracket Battles',
  description: 'Join live slot tournaments with real-time bracket battles. Compete for prizes on Acebet with R2K2!',
  metadataBase: new URL('https://www.r2k2.gg'),
  openGraph: {
    title: 'R2K2 Tournaments',
    description: 'Live slot bracket battles with real-time updates. Join the action!',
    url: 'https://www.r2k2.gg',
    siteName: 'R2K2',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'R2K2 Tournaments',
    description: 'Live slot bracket battles with real-time updates',
  },
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
