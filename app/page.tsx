import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, TrendingUp, Sparkles } from 'lucide-react'
import { KickMiniPlayer } from '@/components/kick-mini-player'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Header } from '@/components/header'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <GiveawayCounter />
      <KickMiniPlayer />
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background"></div>
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Exclusive Code: R2K2</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
              Compete on Our <span className="text-primary">Leaderboards</span>
            </h1>
            <p className="text-2xl font-bold text-primary mt-2">
              $5,000+ in Monthly/Weekly Leaderboards
            </p>
            <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
              Plus $1,000's in additional rewards. Join exclusive competitions across multiple platforms and climb the ranks with code R2K2.
            </p>

          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section id="platforms" className="py-12 md:py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Choose Your Platform</h2>
            <p className="text-base text-muted-foreground">Click a logo to view the leaderboard</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <PlatformCard
              name="Acebet"
              logo="/assets/rainbet.png"
              href="/leaderboard/acebet"
              signupUrl="https://acebet.com/welcome/r/r2k2"
              rewards={[
                "$2,500 Monthly Leaderboard",
                "$250-$500 Weekly Leaderboards",
                "First Time Deposit Bonus",
                "Monthly Wager Bonuses",
                "VIP Rewards",
                "Weekly Slot Tournaments",
                "Daily Stream Giveaways",
                "Lossback"
              ]}
            />
            <PlatformCard
              name="Packdraw"
              logo="/assets/packdraw.png"
              href="/leaderboard/packdraw"
              signupUrl="https://packdraw.com/?ref=R2K2"
              rewards={[
                "Monthly Leaderboard",
                "Rank Up Rewards",
                "First Time Deposit Bonus",
                "Lossback",
                "VIP Rewards"
              ]}
            />
            <PlatformCard
              name="Clash.gg"
              logo="/assets/clash.png"
              href="/leaderboard/clash"
              signupUrl="https://clash.gg/r/R2K2"
              rewards={[
                "Coming Soon",
                "Stay tuned for updates"
              ]}
            />
          </div>
        </div>
      </section>

      {/* Rewards Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">What We Offer</h2>
            <p className="text-base text-muted-foreground">Exclusive perks for R2K2 code users</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* 1st Time Deposit Bonus */}
            <Card className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/40 transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">1st Time Deposit Bonus</h3>
                <p className="text-sm text-muted-foreground">Available on Packdraw and Acebet for new users using code R2K2</p>
              </CardContent>
            </Card>

            {/* Wager Rewards */}
            <Card className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/40 transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Wager Rewards</h3>
                <p className="text-sm text-muted-foreground">Earn rewards based on your wager volume on Packdraw and Acebet</p>
              </CardContent>
            </Card>

            {/* Loss Back */}
            <Card className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/40 transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Loss Back</h3>
                <p className="text-sm text-muted-foreground">Get a percentage of your losses back on both Packdraw and Acebet</p>
              </CardContent>
            </Card>

            {/* Weekly Slot Tournaments */}
            <Card className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/40 transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Weekly Slot Tournaments</h3>
                <p className="text-sm text-muted-foreground">Compete for $100-$50 prizes in weekly tournaments for code users</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Section */}
      <section className="py-12 md:py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Join Our Community</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <SocialCard
              icon="/assets/kick.png"
              name="Kick"
              handle="@R2Ktwo"
              href="https://kick.com/R2Ktwo"
            />
            <SocialCard
              icon="/assets/discord.png"
              name="Discord"
              handle="@R2Ktwo"
              href="https://discord.gg/DwpA8vaGPj"
            />
            <SocialCard
              icon="/assets/x.png"
              name="X"
              handle="@r2ktwo"
              href="https://x.com/r2ktwo"
            />
            <SocialCard
              icon="/assets/instagram.png"
              name="Instagram"
              handle="@R2ktwoKick"
              href="https://instagram.com/R2ktwoKick"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <div className="space-y-2">
                <Link href="/" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
                <Link href="/" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <div className="space-y-2">
                <Link href="/" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
                <Link href="/" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Socials</h3>
              <div className="space-y-2">
                <a href="https://kick.com/R2Ktwo" target="_blank" rel="noopener" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Kick</a>
                <a href="https://discord.gg/DwpA8vaGPj" target="_blank" rel="noopener" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Discord</a>
                <a href="https://x.com/r2ktwo" target="_blank" rel="noopener" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">X</a>
                <a href="https://instagram.com/R2ktwoKick" target="_blank" rel="noopener" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Instagram</a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Responsible Gaming</h3>
              <p className="text-xs text-muted-foreground">
                Remember: Gambling over a long period will always result in losses. Please set limits and gamble responsibly.
              </p>
            </div>
          </div>
          <div className="pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            <p>© 2025 R2K2. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function PlatformCard({ name, logo, href, signupUrl, rewards }: { name: string; logo: string; href: string; signupUrl: string; rewards: string[] }) {
  return (
    <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 bg-card/50 backdrop-blur">
      <Link href={href} className="block group">
        <CardContent className="p-8 flex flex-col items-center gap-6">
          <div className="flex justify-center">
            <div className="w-40 h-40 rounded-2xl bg-secondary/50 p-6 group-hover:scale-105 transition-transform flex items-center justify-center cursor-pointer">
              <img src={logo || "/placeholder.svg"} alt={name} className="w-full h-full object-contain" />
            </div>
          </div>
        </CardContent>
      </Link>
      <CardContent className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 border border-primary/20">
          <span className="text-sm font-bold">Code</span>
          <span className="text-sm font-bold text-primary">R2K2</span>
        </div>
      </CardContent>
      <CardContent className="space-y-2 px-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-2">
          <Sparkles className="h-4 w-4" />
          <span>EXCLUSIVE REWARDS</span>
        </div>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          {rewards.map((reward, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{reward}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardContent className="pt-4">
        <a href={signupUrl} target="_blank" rel="noopener noreferrer">
          <Button className="w-full" size="lg">
            Sign Up
          </Button>
        </a>
      </CardContent>
    </Card>
  )
}

function SocialCard({ icon, name, handle, href }: { icon: string; name: string; handle: string; href: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener"
      className="flex-1 group"
    >
      <Card className="hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 border-border/40 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-secondary/50 p-2 group-hover:scale-105 transition-transform flex items-center justify-center">
            <img src={icon || "/placeholder.svg"} alt={name} className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="font-semibold">{name}</p>
            <p className="text-sm text-muted-foreground">{handle}</p>
          </div>
        </CardContent>
      </Card>
    </a>
  )
}
