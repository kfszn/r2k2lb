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
  completed: boolean
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
      case 'upcoming':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
      case 'completed':
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
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

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
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
              const progress = getProgressPercentage(race.current_wager, race.target_wager)

              return (
                <Card key={race.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle>{race.name}</CardTitle>
                          <Badge className={getStatusColor(race.status)}>
                            {race.status.charAt(0).toUpperCase() + race.status.slice(1)}
                          </Badge>
                        </div>
                        <CardDescription>{race.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">
                          {formatCurrency(race.current_wager)} / {formatCurrency(race.target_wager)}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary to-primary/70 h-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">
                        {Math.round(progress)}% complete
                      </p>
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
                      <Button className="w-full" variant={race.status === 'active' ? 'default' : 'outline'}>
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
