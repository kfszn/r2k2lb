'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'

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
}

export default function WagerRacesPage() {
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        console.log('[v0] Fetching wager races from database...')
        const { data, error } = await supabase
          .from('wager_races')
          .select('*')
          .order('start_date', { ascending: false })

        if (error) {
          console.error('[v0] Error fetching races:', error)
          throw error
        }
        console.log('[v0] Races fetched:', data)
        setRaces(data || [])
      } catch (error) {
        console.error('Failed to fetch races:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRaces()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('wager_races_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wager_races' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRaces(prev => [payload.new as Race, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setRaces(prev => prev.map(r => r.id === (payload.new as Race).id ? payload.new as Race : r))
          } else if (payload.eventType === 'DELETE') {
            setRaces(prev => prev.filter(r => r.id !== (payload.old as Race).id))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getProgressPercentage = () => {
    return 50 // Placeholder for now
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/50 flex items-center justify-center">
        <p className="text-muted-foreground">Loading races...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50 pt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Wager Races</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Join our wager races and compete with other players to reach milestone goals for exclusive rewards.
          </p>
        </div>

        {races.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-center space-y-4 max-w-md">
                <h2 className="text-2xl font-bold">No Active Races</h2>
                <p className="text-muted-foreground">
                  Wager races will appear here once they're created by the admin. Check back soon for upcoming races!
                </p>
                <Link href="/">
                  <Button variant="outline" className="mt-4">Back to Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {races.map((race) => {
              const progress = getProgressPercentage()

              return (
                <Card key={race.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="capitalize">{race.platform} - {race.period}</CardTitle>
                          <Badge className={getStatusColor(race.is_active)}>
                            {race.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <CardDescription>
                          {race.period.charAt(0).toUpperCase() + race.period.slice(1)} wager race on {race.platform}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary to-primary/70 h-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Race Dates */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Starts</p>
                        <p className="font-medium">
                          {format(parseISO(race.start_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Ends</p>
                        <p className="font-medium">
                          {format(parseISO(race.end_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>

                    {/* View Details Button */}
                    <Link href={`/wager-races/${race.id}`} className="block">
                      <Button className="w-full" variant={race.is_active ? 'default' : 'outline'}>
                        View Details & Milestones
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
