'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { Trash2, Plus, Edit2, Lock, Zap } from 'lucide-react'

interface Race {
  id: string
  platform: 'acebet' | 'packdraw'
  period: 'weekly' | 'monthly'
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

interface Milestone {
  id: string
  race_id: string
  wager_amount: number
  reward: number
  reward_type: string
}

interface Winner {
  id: string
  race_id: string
  milestone_id: string
  player_name: string
  claimed_at: string
}

export function WagerRaceManagement() {
  const [races, setRaces] = useState<Race[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRace, setSelectedRace] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = useState(false)
  const [isWinnerDialogOpen, setIsWinnerDialogOpen] = useState(false)
  const [selectedMilestoneForWinner, setSelectedMilestoneForWinner] = useState<string | null>(null)
  const [winnerName, setWinnerName] = useState('')
  const supabase = createClient()

  // Form states
  const [raceName, setRaceName] = useState('')
  const [platform, setPlatform] = useState<'acebet' | 'packdraw'>('packdraw')
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [raceStatus, setRaceStatus] = useState<'upcoming' | 'active' | 'completed'>('upcoming')

  const [milestoneAmount, setMilestoneAmount] = useState('')
  const [milestoneReward, setMilestoneReward] = useState('')
  const [milestoneRewardType, setMilestoneRewardType] = useState('cash')
  const [isSeedingData, setIsSeedingData] = useState(false)

  const handleSeedData = async () => {
    try {
      setIsSeedingData(true)
      const response = await fetch('/api/admin/wager-races/seed', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to seed data')
      const result = await response.json()
      alert(`✓ Created ${result.racesCount} sample races with ${result.milestonesCount} milestones`)
      fetchRaces()
    } catch (error) {
      alert('Failed to seed sample data')
      console.error(error)
    } finally {
      setIsSeedingData(false)
    }
  }

  useEffect(() => {
    fetchRaces()
  }, [])

  useEffect(() => {
    if (selectedRace) {
      fetchMilestones(selectedRace)
    }
  }, [selectedRace])

  const fetchRaces = async () => {
    try {
      const { data, error } = await supabase
        .from('wager_races')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRaces(data || [])
    } catch (error) {
      console.error('Failed to fetch races:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMilestones = async (raceId: string) => {
    try {
      const { data, error } = await supabase
        .from('wager_race_milestones')
        .select('*')
        .eq('race_id', raceId)
        .order('wager_amount', { ascending: true })

      if (error) throw error
      setMilestones(data || [])
    } catch (error) {
      console.error('Failed to fetch milestones:', error)
    }
  }

  const handleCreateRace = async () => {
    if (!platform || !period || !startDate || !endDate) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const { error } = await supabase
        .from('wager_races')
        .insert({
          platform,
          period,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          is_active: raceStatus === 'active',
        })

      if (error) throw error

      setRaceName('')
      setPlatform('packdraw')
      setPeriod('weekly')
      setStartDate('')
      setEndDate('')
      setRaceStatus('upcoming')
      setIsCreateDialogOpen(false)
      fetchRaces()
    } catch (error) {
      alert('Failed to create race')
      console.error(error)
    }
  }
  }

  const handleCreateMilestone = async () => {
    if (!selectedRace || !milestoneAmount || !milestoneReward) return

    try {
      const { error } = await supabase
        .from('wager_race_milestones')
        .insert([
          {
            race_id: selectedRace,
            wager_amount: Number(milestoneAmount),
            reward: Number(milestoneReward),
            reward_type: milestoneRewardType,
          },
        ])

      if (error) throw error

      // Reset form
      setMilestoneAmount('')
      setMilestoneReward('')
      setMilestoneRewardType('cash')
      setIsMilestoneDialogOpen(false)

      // Refresh milestones
      fetchMilestones(selectedRace)
    } catch (error) {
      console.error('Failed to create milestone:', error)
    }
  }

  const handleDeleteRace = async (raceId: string) => {
    if (!confirm('Are you sure you want to delete this race?')) return

    try {
      // Delete associated milestones
      await supabase.from('wager_race_milestones').delete().eq('race_id', raceId)

      // Delete race
      const { error } = await supabase.from('wager_races').delete().eq('id', raceId)

      if (error) throw error

      fetchRaces()
      if (selectedRace === raceId) setSelectedRace(null)
    } catch (error) {
      console.error('Failed to delete race:', error)
    }
  }

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return

    try {
      const { error } = await supabase.from('wager_race_milestones').delete().eq('id', milestoneId)

      if (error) throw error

      if (selectedRace) {
        fetchMilestones(selectedRace)
      }
    } catch (error) {
      console.error('Failed to delete milestone:', error)
    }
  }

  const handleUpdateRaceStatus = async (raceId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('wager_races')
        .update({ is_active: isActive })
        .eq('id', raceId)

      if (error) throw error
      fetchRaces()
    } catch (error) {
      console.error('Failed to update race status:', error)
    }
  }

  const handleLockWinner = async () => {
    if (!selectedMilestoneForWinner || !winnerName) return

    try {
      const response = await fetch('/api/admin/wager-races/winners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId: selectedMilestoneForWinner,
          playerName: winnerName,
        }),
      })

      if (!response.ok) throw new Error('Failed to lock winner')

      setWinnerName('')
      setSelectedMilestoneForWinner(null)
      setIsWinnerDialogOpen(false)

      if (selectedRace) {
        fetchMilestones(selectedRace)
      }
    } catch (error) {
      console.error('Failed to lock winner:', error)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Wager Races Management</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleSeedData}
            disabled={isSeedingData}
            variant="outline"
            size="sm"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isSeedingData ? 'Seeding...' : 'Seed Sample Data'}
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Race
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Race</DialogTitle>
              <DialogDescription>Set up a new wager race with milestones</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select value={platform} onValueChange={(v) => setPlatform(v as any)}>
                  <SelectTrigger id="platform">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="packdraw">Packdraw</SelectItem>
                    <SelectItem value="acebet">AceBet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="period">Period</Label>
                <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
                  <SelectTrigger id="period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start">Start Date</Label>
                  <Input
                    id="start"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end">End Date</Label>
                  <Input
                    id="end"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={raceStatus} onValueChange={(v) => setRaceStatus(v as any)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleCreateRace} className="w-full">
                Create Race
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Races List */}
        <Card>
          <CardHeader>
            <CardTitle>All Races</CardTitle>
            <CardDescription>{races.length} races</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {races.length === 0 ? (
              <p className="text-sm text-muted-foreground">No races created yet</p>
            ) : (
              races.map((race) => (
                <div
                  key={race.id}
                  onClick={() => setSelectedRace(race.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedRace === race.id
                      ? 'bg-primary/10 border border-primary'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold capitalize">{race.platform} - {race.period}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(race.start_date), 'MMM d, yyyy HH:mm')} → {format(new Date(race.end_date), 'MMM d HH:mm')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteRace(race.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="capitalize">Status: {race.is_active ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Race Details & Milestones */}
        {selectedRace ? (
          <Card>
            <CardHeader>
              <CardTitle>Race Milestones</CardTitle>
              <CardDescription>Manage milestones for selected race</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Race</Label>
                <Select value={selectedRace} onValueChange={setSelectedRace}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {races.map((race) => (
                      <SelectItem key={race.id} value={race.id}>
                        {race.platform.toUpperCase()} - {race.period} ({format(new Date(race.start_date), 'MMM d')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Current Wager Update */}
              <div className="space-y-2 bg-secondary p-3 rounded-lg">
                <Label>Update Current Wager ($)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    onBlur={(e) => {
                      if (e.target.value) {
                        handleUpdateWager(selectedRace, Number(e.target.value))
                        e.target.value = ''
                      }
                    }}
                  />
                </div>
              </div>

              {/* Active Status Toggle */}
              {selectedRace && races.find((r) => r.id === selectedRace) && (
                <div className="space-y-2">
                  <Label>Race Active Status</Label>
                  <Select
                    value={races.find((r) => r.id === selectedRace)?.is_active ? 'active' : 'inactive'}
                    onValueChange={(v) => handleUpdateRaceStatus(selectedRace, v === 'active')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Add Milestone */}
              <Dialog open={isMilestoneDialogOpen} onOpenChange={setIsMilestoneDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Milestone
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Milestone</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Required Wager ($)</Label>
                      <Input
                        type="number"
                        value={milestoneAmount}
                        onChange={(e) => setMilestoneAmount(e.target.value)}
                        placeholder="5000"
                      />
                    </div>
                    <div>
                      <Label>Reward ($)</Label>
                      <Input
                        type="number"
                        value={milestoneReward}
                        onChange={(e) => setMilestoneReward(e.target.value)}
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <Label>Reward Type</Label>
                      <Select value={milestoneRewardType} onValueChange={setMilestoneRewardType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bonus">Bonus</SelectItem>
                          <SelectItem value="free-play">Free Play</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleCreateMilestone} className="w-full">
                      Add Milestone
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Milestones List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {milestones.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No milestones yet</p>
                ) : (
                  milestones.map((milestone) => (
                    <div key={milestone.id} className="bg-secondary p-2 rounded-lg flex justify-between items-center">
                      <div className="text-sm flex-1">
                        <p className="font-medium">${milestone.wager_amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Reward: ${milestone.reward} {milestone.reward_type}</p>
                      </div>
                      <div className="flex gap-1">
                        <Dialog open={isWinnerDialogOpen && selectedMilestoneForWinner === milestone.id} onOpenChange={(open) => {
                          setIsWinnerDialogOpen(open)
                          if (open) setSelectedMilestoneForWinner(milestone.id)
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedMilestoneForWinner(milestone.id)
                                setIsWinnerDialogOpen(true)
                              }}
                              title="Lock a winner for this milestone"
                            >
                              <Lock className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-sm">
                            <DialogHeader>
                              <DialogTitle>Lock Winner</DialogTitle>
                              <DialogDescription>
                                Assign a player as the winner for this milestone
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Player Name</Label>
                                <Input
                                  value={winnerName}
                                  onChange={(e) => setWinnerName(e.target.value)}
                                  placeholder="Enter player name"
                                />
                              </div>
                              <Button onClick={handleLockWinner} className="w-full">
                                Lock Winner
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteMilestone(milestone.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-full py-12">
              <p className="text-muted-foreground">Select a race to manage milestones</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
