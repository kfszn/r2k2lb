'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'
import { CheckCircle2, Circle } from 'lucide-react'

interface Race {
  id: string
  platform: 'acebet' | 'packdraw'
  period: 'weekly' | 'monthly'
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Milestone {
  id: string
  race_id: string
  wager_amount: number
  reward_amount: number
  milestone_order: number
  created_at: string
}

interface Winner {
  id: string
  race_id: string
  milestone_id: string
  username: string
  platform: string
  won_at: string
  created_at: string
}

export default function RaceDetailPage() {
  const params = useParams()
  const raceId = params.id as string
  const [race, setRace] = useState<Race | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [winners, setWinners] = useState<Winner[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchRaceData = async () => {
      try {
        // Fetch race
        const { data: raceData, error: raceError } = await supabase
          .from('wager_races')
          .select('*')
          .eq('id', raceId)
          .single()

        if (raceError) throw raceError
        setRace(raceData)

        // Fetch milestones
        const { data: milestonesData, error: milestonesError } = await supabase
          .from('wager_race_milestones')
          .select('*')
          .eq('race_id', raceId)
          .order('wager_amount', { ascending: true })

        if (milestonesError) throw milestonesError
        setMilestones(milestonesData || [])

        // Fetch winners
        const { data: winnersData, error: winnersError } = await supabase
          .from('wager_race_winners')
          .select('*')
          .eq('race_id', raceId)

        if (winnersError) throw winnersError
        setWinners(winnersData || [])
      } catch (error) {
        console.error('Failed to fetch race data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (raceId) {
      fetchRaceData()

      // Subscribe to real-time updates
      const raceSubscription = supabase
        .channel(`race_${raceId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'wager_races', filter: `id=eq.${raceId}` },
          (payload) => {
            if (payload.new) {
              setRace(payload.new as Race)
            }
          }
        )
        .subscribe()

      const milestonesSubscription = supabase
        .channel(`milestones_${raceId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'wager_race_milestones', filter: `race_id=eq.${raceId}` },
          (payload) => {
            fetchRaceData()
          }
        )
        .subscribe()

      const winnersSubscription = supabase
        .channel(`winners_${raceId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'wager_race_winners', filter: `race_id=eq.${raceId}` },
          (payload) => {
            fetchRaceData()
          }
        )
        .subscribe()

      return () => {
        raceSubscription.unsubscribe()
        milestonesSubscription.unsubscribe()
        winnersSubscription.unsubscribe()
      }
    }
  }, [raceId, supabase])

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
  }

  const getMilestoneWinners = (milestoneId: string) => {
    return winners.filter(w => w.milestone_id === milestoneId).sort((a, b) => 
      new Date(a.won_at).getTime() - new Date(b.won_at).getTime()
    )
  }

  const getFirstWinner = (milestoneId: string) => {
    const milestoneWinners = getMilestoneWinners(milestoneId)
    return milestoneWinners.length > 0 ? milestoneWinners[0] : null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/50 flex items-center justify-center">
        <p className="text-muted-foreground">Loading race details...</p>
      </div>
    )
  }

  if (!race) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/50 flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Race not found</p>
        <Link href="/wager-races">
          <Button>Back to Races</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50 pt-20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link href="/wager-races" className="text-primary hover:underline mb-4 inline-block">
            ← Back to Races
          </Link>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold capitalize">{race.platform} - {race.period}</h1>
              <p className="text-lg text-muted-foreground mt-2">{race.period.charAt(0).toUpperCase() + race.period.slice(1)} wager race on {race.platform}</p>
            </div>
            <Badge className={race.is_active ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}>
              {race.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        {/* Race Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Race Period</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold capitalize">{race.period}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {format(parseISO(race.start_date), 'MMM d')} - {format(parseISO(race.end_date), 'MMM d, yyyy')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Platform</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold capitalize">{race.platform}</p>
            </CardContent>
          </Card>
        </div>

        {/* Overall Progress Bar - Removed since we don't have current_wager tracking */}

        {/* Milestones */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Milestones</h2>
          <div className="space-y-4">
            {milestones.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">No milestones available yet</p>
                </CardContent>
              </Card>
            ) : (
              milestones.map((milestone, index) => {
                const firstWinner = getFirstWinner(milestone.id)
                const hasWinner = !!firstWinner

                return (
                  <Card key={milestone.id} className={hasWinner ? 'border-green-500/50 bg-green-500/5' : ''}>
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="mt-1">
                            {hasWinner ? (
                              <CheckCircle2 className="h-6 w-6 text-green-500" />
                            ) : (
                              <Circle className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">Milestone {index + 1}</CardTitle>
                            <CardDescription>
                              Reach ${milestone.wager_amount.toLocaleString()} in wagers
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-secondary rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Reward Amount</p>
                        <p className="text-2xl font-bold">${milestone.reward_amount.toLocaleString()}</p>
                      </div>

                      {/* First Achiever - Prominently Displayed */}
                      {firstWinner && (
                        <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg p-5 border-2 border-primary/50">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-primary/30 flex items-center justify-center">
                              <CheckCircle2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-muted-foreground">FIRST ACHIEVER</p>
                              <p className="text-lg font-bold">{firstWinner.username}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Platform: <span className="font-medium capitalize">{firstWinner.platform}</span></span>
                            <span className="text-muted-foreground">
                              {format(parseISO(firstWinner.won_at), 'MMM d, yyyy HH:mm')}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Other Winners */}
                      {getMilestoneWinners(milestone.id).length > 1 && (
                        <div className="bg-secondary/50 rounded-lg p-4 border border-secondary">
                          <p className="text-sm font-semibold mb-3">Other Achievers</p>
                          <div className="space-y-2">
                            {getMilestoneWinners(milestone.id).slice(1).map((winner) => (
                              <div key={winner.id} className="flex justify-between items-center text-sm py-2 border-t border-secondary">
                                <div>
                                  <span className="font-medium">{winner.username}</span>
                                  <span className="text-muted-foreground text-xs ml-2">({winner.platform})</span>
                                </div>
                                <span className="text-muted-foreground text-xs">
                                  {format(parseISO(winner.won_at), 'MMM d HH:mm')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No Winner Yet */}
                      {!hasWinner && (
                        <div className="bg-secondary/50 rounded-lg p-4 border border-dashed border-secondary text-center">
                          <p className="text-sm text-muted-foreground">Waiting for first achiever...</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>

        {/* Race Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Race Timeline</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Start Date</p>
              <p className="text-lg font-semibold">
                {format(parseISO(race.start_date), 'MMMM d, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">End Date</p>
              <p className="text-lg font-semibold">
                {format(parseISO(race.end_date), 'MMMM d, yyyy')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
