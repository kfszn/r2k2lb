import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { Header } from '@/components/header'

export default function RafflePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
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
