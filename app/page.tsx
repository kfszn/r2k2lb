import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Swords, Users, TrendingUp } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">R2K2 Tournaments</h1>
          </div>
          <Link href="/admin">
            <Button variant="outline" size="sm">Admin Panel</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <h2 className="text-5xl font-bold text-balance leading-tight">
            Live Slot Bracket <span className="text-primary">Battles</span>
          </h2>
          <p className="text-xl text-muted-foreground text-pretty">
            {'Join real-time tournament action with live brackets, instant updates, and competitive slot gameplay on Acebet'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link href="/tournament">
              <Button size="lg" className="text-lg px-8">
                <Trophy className="mr-2 h-5 w-5" />
                View Live Tournament
              </Button>
            </Link>
            <Link href="/tournament">
              <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
                <Swords className="mr-2 h-5 w-5" />
                See Bracket
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="border-border">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Live Competition</CardTitle>
              <CardDescription>
                Watch matches unfold in real-time as players compete head-to-head in bracket-style tournaments
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>Real-Time Updates</CardTitle>
              <CardDescription>
                Instant bracket updates and live scoring keep you connected to every moment of the action
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-winner/20 flex items-center justify-center mb-4">
                <Trophy className="h-6 w-6 text-winner" />
              </div>
              <CardTitle>Competitive Prizes</CardTitle>
              <CardDescription>
                Battle through the bracket to claim victory and earn your place in the winners circle
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 max-w-3xl mx-auto">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <h3 className="text-3xl font-bold text-balance">Ready to compete?</h3>
            <p className="text-muted-foreground text-pretty">
              {'Join the tournament now and see if you have what it takes to reach the top of the bracket'}
            </p>
            <Link href="/tournament">
              <Button size="lg" className="text-lg px-8 mt-4">
                Enter Tournament
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2024 R2K2 Tournaments • Powered by Acebet</p>
        </div>
      </footer>
    </div>
  )
}
