import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

export default function RafflePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/assets/logo.png" alt="R2K2" width={48} height={48} className="rounded-lg" />
            <span className="text-2xl font-bold">
              R2K<span className="text-primary">2</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
            <Link href="#platforms" className="text-sm font-medium hover:text-primary transition-colors">Leaderboards</Link>
            <Link href="/raffle" className="text-sm font-medium hover:text-primary transition-colors">Raffle</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Raffle Coming Soon</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Our raffle system is currently under development. Check back soon for exciting prizes and giveaways!
            </p>
            <Link href="/">
              <Button>Return to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
