import { GiveawayCounter } from '@/components/giveaway-counter';
import { Header } from '@/components/header';
import { RaffleView } from '@/components/raffle/raffle-view';

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
            Wager during the raffle period to automatically earn your entry. One winner takes all.
          </p>
        </div>

        <RaffleView platform="acebet" />
      </main>
    </div>
  );
}
