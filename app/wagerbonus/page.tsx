import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { GiveawayBanner } from '@/components/giveaway-banner'
import Header from '@/components/header'

export default function WagerBonusPage() {
  return (
    <div className="min-h-screen bg-background">
      <GiveawayBanner />
      <Header />
      <main className="container mx-auto px-4 py-20">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Wager Bonus Coming Soon</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Our wager bonus program is currently under development. Check back soon for exclusive rewards!
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
