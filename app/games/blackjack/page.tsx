import { GameShell } from '@/components/games/game-shell'
import { BlackjackBoard } from '@/components/games/blackjack-board'

export default function BlackjackPage() {
  return (
    <GameShell title="Blackjack" game="blackjack">
      <BlackjackBoard />
    </GameShell>
  )
}
