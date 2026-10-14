import type { Metadata } from 'next'
import { GameShell } from '@/components/games/game-shell'
import { LimboBoard } from '@/components/games/limbo-board'
import { generatePageMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generatePageMetadata('gamesLimbo')

export default function LimboPage() {
  return (
    <GameShell title="Limbo" game="limbo">
      <LimboBoard />
    </GameShell>
  )
}
