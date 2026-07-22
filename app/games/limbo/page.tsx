import { GameShell } from '@/components/games/game-shell'
import { LimboBoard } from '@/components/games/limbo-board'

export default function LimboPage() {
  return (
    <GameShell title="Limbo" game="limbo">
      <LimboBoard />
    </GameShell>
  )
}
