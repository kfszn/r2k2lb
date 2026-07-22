import { GameShell } from '@/components/games/game-shell'
import { PlinkoBoard } from '@/components/games/plinko-board'

export default function PlinkoPage() {
  return (
    <GameShell title="Plinko" game="plinko">
      <PlinkoBoard />
    </GameShell>
  )
}
