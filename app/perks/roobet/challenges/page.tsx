import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { ChallengesClient } from './challenges-client'

export const metadata: Metadata = {
  title: 'Challenges | Roobet — R2K2',
  description:
    'Complete Roobet challenges and win prizes. Hit specific multipliers, land big wins, and claim your reward through Discord.',
}

export const revalidate = 60

type Challenge = {
  id: string
  title: string
  description: string
  prize: string
  image_url: string | null
  active: boolean
  sort_order: number
}

async function getChallenges(): Promise<Challenge[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  // Fetch all challenges — client handles active/inactive filter
  const { data } = await supabase
    .from('roobet_challenges')
    .select('id, title, description, prize, image_url, active, sort_order')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function RoobetChallengesPage() {
  const challenges = await getChallenges()

  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <ChallengesClient challenges={challenges} />
        </div>
      </main>
    </div>
  )
}
