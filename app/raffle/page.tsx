import { GiveawayCounter } from '@/components/giveaway-counter';
import { Header } from '@/components/header';
import { RaffleView } from '@/components/raffle/raffle-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function RafflePage() {
  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight text-balance mb-3">
            Weekly Raffle
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-balance">
            Two ways to win. Wager for automatic entries, or land a huge multiplier for bonus tickets.
          </p>
        </div>

        <Tabs defaultValue="wager" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="wager">Wager Raffle</TabsTrigger>
            <TabsTrigger value="multiplier">Highest Multi Raffle</TabsTrigger>
          </TabsList>
          <TabsContent value="wager">
            <RaffleView platform="roobet" raffleType="wager" />
          </TabsContent>
          <TabsContent value="multiplier">
            <RaffleView platform="roobet" raffleType="multiplier" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
