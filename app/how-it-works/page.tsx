import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Header from '@/components/header'
import {
  UserPlus,
  Link2,
  MessageSquare,
  Clock,
  ShoppingBag,
  Ticket,
  CheckCircle,
  Shield,
  HelpCircle,
  Spade,
  Grid3x3,
  CircleDot,
} from 'lucide-react'

import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generatePageMetadata('howItWorks')

const earnSteps = [
  {
    icon: UserPlus,
    title: 'Create an Account',
    desc: 'Sign up at R2K2.gg and get your unique account ID in the format R2K2-XXXXX.',
  },
  {
    icon: Link2,
    title: 'Link your Kick Account',
    desc: "Go to R2K2's Kick channel and type !verify R2K2-XXXXX in chat to link your accounts.",
  },
  {
    icon: MessageSquare,
    title: 'Chat to Earn',
    desc: 'Earn 1 point for every message you send in chat during a live stream.',
  },
  {
    icon: Clock,
    title: 'Watch to Earn',
    desc: 'Earn 1 point every 10 minutes you\'re active in the stream. You must send at least 3 messages per stream to qualify.',
  },
]

const redeemSteps = [
  { text: 'Head to the Shop' },
  { text: 'Browse available rewards' },
  { text: 'Click Redeem on an item you want' },
  { text: 'Confirm your redemption — points are deducted instantly' },
  { text: 'You\'ll receive an Order ID (format: ORD-XXXXXX)' },
  { text: 'Open a ticket in the R2K2 Discord with your Order ID to claim your reward' },
]

const games = [
  {
    icon: Spade,
    name: 'Blackjack',
    desc: 'Classic blackjack vs the dealer. Win 2x your wager.',
    href: '/games/blackjack',
  },
  {
    icon: Grid3x3,
    name: 'Keno',
    desc: 'Pick up to 6 numbers from a 30-number grid. Match numbers to win multipliers up to 750x.',
    href: '/games/keno',
  },
  {
    icon: CircleDot,
    name: 'Plinko',
    desc: 'Drop a ball through 16 rows of pegs. Land on high multipliers to win big. Max win: 20,000 pts.',
    href: '/games/plinko',
  },
]

const faqs = [
  {
    q: 'Do points expire?',
    a: 'No, points never expire.',
  },
  {
    q: 'Can I transfer points to another account?',
    a: 'No, points are non-transferable.',
  },
  {
    q: 'How long does redemption take?',
    a: 'Most redemptions are fulfilled within 24 hours. Open a Discord ticket with your Order ID to get started.',
  },
  {
    q: "What if the stream isn't live?",
    a: 'Points are only earned during live streams. Chat messages sent when the stream is offline do not earn points.',
  },
  {
    q: 'How do I check my balance?',
    a: 'Your points balance is always visible on your Account page at r2k2.gg/account.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero */}
      <section className="border-b border-border/40 bg-card/30">
        <div className="container mx-auto px-4 py-16 md:py-24 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
            R2K2 Points System
          </p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            How It Works
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Earn points by watching and chatting live, then spend them in the shop or wager them in house games.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 md:py-16 space-y-20 max-w-4xl">

        {/* Section 1 — What are R2K2 Points? */}
        <section>
          <SectionHeader label="01" title="What are R2K2 Points?" />
          <div className="bg-card border border-border/40 rounded-2xl p-6 md:p-8">
            <p className="text-muted-foreground leading-relaxed text-base">
              R2K2 Points are the loyalty currency of{' '}
              <span className="text-foreground font-semibold">R2K2.gg</span>. Earn points by
              watching and participating in R2K2&apos;s live streams on Kick, then spend them in
              the shop or wager them in our provably fair house games.
            </p>
          </div>
        </section>

        {/* Section 2 — How to Earn */}
        <section>
          <SectionHeader label="02" title="How to Earn Points" />
          <div className="grid sm:grid-cols-2 gap-4">
            {earnSteps.map((step, i) => (
              <div
                key={i}
                className="flex gap-4 bg-card border border-border/40 rounded-2xl p-5 hover:border-primary/40 transition-colors"
              >
                <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">{step.title}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3 — How to Redeem */}
        <section>
          <SectionHeader label="03" title="How to Redeem Points" />
          <div className="bg-card border border-border/40 rounded-2xl p-6 md:p-8">
            <ol className="space-y-3">
              {redeemSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground text-sm leading-relaxed">{step.text}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Section 4 — Shop Items */}
        <section>
          <SectionHeader label="04" title="Shop Items" />
          <div className="bg-card border border-primary/30 rounded-2xl p-6 md:p-8 flex items-center gap-5">
            <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">$100 Tip</p>
              <p className="text-muted-foreground text-sm">R2K2 will tip you $100 live on stream.</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-primary">60,000</p>
              <p className="text-xs text-muted-foreground">points</p>
            </div>
          </div>
        </section>

        {/* Section 5 — House Games */}
        <section>
          <SectionHeader label="05" title="House Games" />
          <div className="grid sm:grid-cols-3 gap-4">
            {games.map((g) => (
              <Link
                key={g.name}
                href={g.href}
                className="group bg-card border border-border/40 rounded-2xl p-5 hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <g.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-bold mb-1">{g.name}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{g.desc}</p>
              </Link>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            All games use a provably fair system — every result is cryptographically verifiable.
          </p>
        </section>

        {/* Section 6 — Provably Fair */}
        <section>
          <SectionHeader label="06" title="Provably Fair" />
          <div className="bg-card border border-border/40 rounded-2xl p-6 md:p-8 flex gap-5">
            <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Every game result on R2K2.gg is provably fair. Before each bet, you&apos;re shown
                a hashed server seed. After the bet, the original server seed is revealed so you
                can verify the result yourself using our verification tool at{' '}
                <Link href="/games/fairness" className="text-primary underline underline-offset-2">
                  /games/fairness
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Section 7 — FAQ */}
        <section>
          <SectionHeader label="07" title="FAQ" />
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-card border border-border/40 rounded-2xl p-5">
                <div className="flex gap-3">
                  <HelpCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm mb-1">{faq.q}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center pb-8">
          <div className="bg-card border border-primary/30 rounded-2xl p-8 md:p-12">
            <CheckCircle className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-black mb-3">Ready to start earning?</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
              Create your account, link your Kick, and start accumulating points every stream.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Create Account
                </Button>
              </Link>
              <Link href="/shop">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                  Visit Shop
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-xs font-black text-primary/50 tracking-widest">{label}</span>
      <h2 className="text-xl md:text-2xl font-black">{title}</h2>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  )
}
