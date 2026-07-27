import { GiveawayCounter } from '@/components/giveaway-counter';
import { Header } from '@/components/header';
import { RaffleView } from '@/components/raffle/raffle-view';

export default function CsbattleRafflePage() {
  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight text-balance mb-3">
            CSBattle Raffle
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-balance">
            Wager on CSBattle with code R2K2 during the raffle period to automatically earn your entry. One winner takes all.
          </p>
        </div>

        <RaffleView platform="csbattle" />
      </main>
    </div>
  );
}
