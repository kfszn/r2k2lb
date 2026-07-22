import { GameShell } from '@/components/games/game-shell'
import { KenoBoard } from '@/components/games/keno-board'

export default function KenoPage() {
  return (
    <GameShell title="Keno" game="keno">
      <KenoBoard />
    </GameShell>
  )
}
