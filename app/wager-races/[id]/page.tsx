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
  name: string
  description: string
  status: 'upcoming' | 'active' | 'completed'
  target_wager: number
  current_wager: number
  start_date: string
  end_date: string
  created_at: string
}

interface Milestone {
  id: string
  race_id: string
  wager_amount: number
  reward: number
  reward_type: string
  completed: boolean
}

interface Winner {
  id: string
  race_id: string
  milestone_id: string
  player_name: string
  claimed_at: string
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500'
      case 'upcoming':
        return 'bg-blue-500/10 text-blue-500'
      case 'completed':
        return 'bg-gray-500/10 text-gray-500'
      default:
        return ''
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getMilestoneWinners = (milestoneId: string) => {
    return winners.filter(w => w.milestone_id === milestoneId)
  }

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
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

  const progress = getProgressPercentage(race.current_wager, race.target_wager)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50 pt-20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link href="/wager-races" className="text-primary hover:underline mb-4 inline-block">
            ← Back to Races
          </Link>
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold">{race.name}</h1>
            <Badge className={`${getStatusColor(race.status)} text-lg px-4 py-2`}>
              {race.status.charAt(0).toUpperCase() + race.status.slice(1)}
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground">{race.description}</p>
        </div>

        {/* Race Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Overall Target</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(race.target_wager)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Current Progress</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(race.current_wager)}</p>
              <p className="text-sm text-muted-foreground mt-1">{Math.round(progress)}% complete</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Remaining</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(Math.max(0, race.target_wager - race.current_wager))}</p>
            </CardContent>
          </Card>
        </div>

        {/* Overall Progress Bar */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Overall Race Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-primary/70 h-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {Math.round(progress)}% of {formatCurrency(race.target_wager)} target reached
            </p>
          </CardContent>
        </Card>

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
                const milestoneWinners = getMilestoneWinners(milestone.id)
                const isCompleted = race.current_wager >= milestone.wager_amount

                return (
                  <Card key={milestone.id} className={isCompleted ? 'bg-primary/5' : ''}>
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="mt-1">
                            {isCompleted ? (
                              <CheckCircle2 className="h-6 w-6 text-green-500" />
                            ) : (
                              <Circle className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">Milestone {index + 1}</CardTitle>
                            <CardDescription>
                              Reach {formatCurrency(milestone.wager_amount)} in wagers
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-secondary rounded-lg p-4">
                          <p className="text-sm text-muted-foreground mb-1">Required Wager</p>
                          <p className="text-2xl font-bold">{formatCurrency(milestone.wager_amount)}</p>
                        </div>
                        <div className="bg-secondary rounded-lg p-4">
                          <p className="text-sm text-muted-foreground mb-1">Reward</p>
                          <p className="text-2xl font-bold">{formatCurrency(milestone.reward)}</p>
                        </div>
                      </div>

                      {/* Winners for this milestone */}
                      {milestoneWinners.length > 0 && (
                        <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                          <p className="text-sm font-semibold mb-2">Winners</p>
                          <div className="space-y-2">
                            {milestoneWinners.map((winner) => (
                              <div key={winner.id} className="flex justify-between text-sm">
                                <span className="font-medium">{winner.player_name}</span>
                                <span className="text-muted-foreground">
                                  {format(parseISO(winner.claimed_at), 'MMM d, yyyy')}
                                </span>
                              </div>
                            ))}
                          </div>
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
