import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { BracketProvider } from '@/lib/bracket-context'
import { defaultMetadata } from '@/lib/seo-metadata'
import Footer from '@/components/footer'
import FloatingBackground from '@/components/floating-background'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  ...defaultMetadata,
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased flex flex-col min-h-screen relative">
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
