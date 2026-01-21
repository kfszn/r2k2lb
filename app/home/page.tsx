import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, TrendingUp, Sparkles } from 'lucide-react'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-3">
            <Image src="/assets/logo.png" alt="R2K2" width={48} height={48} className="rounded-lg" />
            <span className="text-2xl font-bold">
              R2K<span className="text-primary">2</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/home" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
            <Link href="#platforms" className="text-sm font-medium hover:text-primary transition-colors">Leaderboards</Link>
            <Link href="/raffle" className="text-sm font-medium hover:text-primary transition-colors">Raffle</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/tournament">
              <Button size="sm" variant="outline" className="hidden md:flex bg-transparent">
                <Trophy className="mr-2 h-4 w-4" />
                Tournament
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="sm">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background"></div>
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Exclusive Code: R2K2</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight text-balance">
              Compete on Our <span className="text-primary">Leaderboards</span>
            </h1>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Join exclusive leaderboard competitions across multiple platforms. Unlock rewards and climb the ranks with code R2K2.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="#platforms">
                <Button size="lg" className="w-full sm:w-auto">
                  View Platforms
                </Button>
              </Link>
              <Link href="/raffle">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                  Enter Raffle
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section id="platforms" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Choose Your Platform</h2>
            <p className="text-lg text-muted-foreground">Click a logo to view the leaderboard</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <PlatformCard
              name="Acebet"
              logo="/assets/rainbet.png"
              type="MONTHLY LEADERBOARD"
              href="/leaderboard/acebet"
            />
            <PlatformCard
              name="Packdraw"
              logo="/assets/packdraw.png"
              type="LIVE LEADERBOARD"
              href="/leaderboard/packdraw"
            />
            <PlatformCard
              name="Clash.gg"
              logo="/assets/clash.png"
              type="MONTHLY LEADERBOARD"
              href="/"
            />
          </div>
        </div>
      </section>

      {/* Social Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
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

function PlatformCard({ name, logo, type, href }: { name: string; logo: string; type: string; href: string }) {
  return (
    <Card className="group hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-8 space-y-6">
        <div className="flex justify-center">
          <div className="relative w-32 h-32 rounded-2xl bg-secondary/50 p-4 group-hover:scale-105 transition-transform">
            <Image src={logo || "/placeholder.svg"} alt={name} fill className="object-contain p-2" />
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-sm font-bold">Code</span>
            <span className="text-sm font-bold text-primary">R2K2</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>EXCLUSIVE REWARDS</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span>{type}</span>
          </div>
        </div>

        <Link href={href}>
          <Button className="w-full" size="lg">
            Sign Up
          </Button>
        </Link>
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
          <div className="relative w-12 h-12 rounded-lg bg-secondary/50 p-2 group-hover:scale-105 transition-transform">
            <Image src={icon || "/placeholder.svg"} alt={name} fill className="object-contain p-1" />
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
