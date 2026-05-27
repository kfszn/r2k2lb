'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useEffect, useState } from 'react'

const actionCards = [
  {
    label: 'Link your Discord',
    description: 'Join the community, get notified of giveaways, and connect with other members.',
    href: 'https://www.discord.gg/r2k2',
    external: true,
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
        <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.175 13.175 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028Z" />
      </svg>
    ),
    iconBg: 'bg-[#5865F2]/15',
    iconColor: 'text-[#5865F2]',
    borderHover: 'hover:border-[#5865F2]/40',
  },
  {
    label: 'Watch on Kick',
    description: 'Catch live streams, bonus hunts, and stream games to earn points in real time.',
    href: 'https://www.kick.com/r2ktwo',
    external: true,
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
        <path d="M2 2h7v4.5L12.5 2H20l-6.5 7L20 16h-7.5L9 11.5V16H2V2Z" />
      </svg>
    ),
    iconBg: 'bg-[#53fc18]/10',
    iconColor: 'text-[#53fc18]',
    borderHover: 'hover:border-[#53fc18]/40',
  },
  {
    label: 'View Leaderboards',
    description: 'See how you stack up against other members and track your progress.',
    href: 'https://www.r2k2.gg',
    external: true,
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 3v18h18" />
        <path d="M7 16l4-4 4 4 5-5" />
      </svg>
    ),
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    borderHover: 'hover:border-primary/40',
  },
]

function CheckmarkAnimation() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="flex items-center justify-center">
      <div
        className={`relative w-24 h-24 transition-all duration-700 ${visible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
      >
        {/* Outer glow ring */}
        <div
          className={`absolute inset-0 rounded-full bg-green-500/10 transition-all duration-1000 delay-300 ${visible ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}`}
          style={{ animation: visible ? 'ping 1s ease-out forwards 0.3s' : 'none' }}
        />
        {/* Circle background */}
        <div className="w-full h-full rounded-full bg-green-500/15 border-2 border-green-500/40 flex items-center justify-center">
          <svg
            viewBox="0 0 52 52"
            className="w-12 h-12"
            aria-hidden="true"
          >
            <circle
              cx="26"
              cy="26"
              r="24"
              fill="none"
              stroke="rgb(34 197 94)"
              strokeWidth="2"
              strokeDasharray="150"
              strokeDashoffset={visible ? '0' : '150'}
              style={{
                transition: 'stroke-dashoffset 0.6s ease-in-out 0.1s',
              }}
            />
            <path
              fill="none"
              stroke="rgb(34 197 94)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 27l8 8 16-16"
              strokeDasharray="40"
              strokeDashoffset={visible ? '0' : '40'}
              style={{
                transition: 'stroke-dashoffset 0.4s ease-in-out 0.6s',
              }}
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function VerifiedPage() {
  const [cardsVisible, setCardsVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setCardsVisible(true), 800)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Subtle background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, oklch(0.65 0.2 250 / 0.06), transparent)',
        }}
      />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/assets/logo.png"
            alt="R2K2"
            width={56}
            height={56}
            className="rounded-xl"
          />
        </div>

        {/* Success header card */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-sm mb-4">
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4 text-center">
            <CheckmarkAnimation />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Your account is verified
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Welcome to R2K2.GG — your account is ready. Start exploring perks, leaderboards, and live stream games.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action cards */}
        <div className="flex flex-col gap-3 mb-4">
          {actionCards.map((card, i) => (
            <a
              key={card.label}
              href={card.href}
              target={card.external ? '_blank' : undefined}
              rel={card.external ? 'noopener noreferrer' : undefined}
              className={`block transition-all duration-500 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div
                className={`flex items-center gap-4 p-4 rounded-xl bg-card/60 border border-border/40 backdrop-blur-sm cursor-pointer transition-colors duration-200 ${card.borderHover} hover:bg-secondary/30`}
              >
                <div className={`flex-shrink-0 w-11 h-11 rounded-lg ${card.iconBg} ${card.iconColor} flex items-center justify-center`}>
                  {card.icon}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-semibold text-foreground text-sm">{card.label}</div>
                  <div className="text-muted-foreground text-xs leading-relaxed mt-0.5 line-clamp-2">{card.description}</div>
                </div>
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 text-muted-foreground flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </a>
          ))}
        </div>

        {/* Primary CTA */}
        <div
          className={`transition-all duration-500 delay-300 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <Button asChild className="w-full h-12 text-base font-semibold">
            <Link href="/account">Go to your Account</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
