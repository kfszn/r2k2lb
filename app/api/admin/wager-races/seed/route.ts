'use server'

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Create sample races
    const racesToCreate = [
      {
        name: 'January Wager Rush',
        description: 'Race to accumulate $50,000 in wagers. Reach milestones for exclusive rewards!',
        status: 'active',
        target_wager: 50000,
        current_wager: 12500,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        name: 'Mega Wager Challenge',
        description: 'The ultimate wager race! Reach $100,000 to unlock premium rewards.',
        status: 'upcoming',
        target_wager: 100000,
        current_wager: 0,
        start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]

    const { data: races, error: racesError } = await supabase
      .from('wager_races')
      .insert(racesToCreate)
      .select()

    if (racesError) throw racesError

    // Create milestones for each race
    const milestonesToCreate = races.flatMap((race: any) => {
      if (race.status === 'active') {
        return [
          { race_id: race.id, wager_amount: 10000, reward: 500, reward_type: 'bonus' },
          { race_id: race.id, wager_amount: 25000, reward: 1500, reward_type: 'bonus' },
          { race_id: race.id, wager_amount: 50000, reward: 5000, reward_type: 'bonus' },
        ]
      } else {
        return [
          { race_id: race.id, wager_amount: 25000, reward: 1000, reward_type: 'bonus' },
          { race_id: race.id, wager_amount: 50000, reward: 3000, reward_type: 'bonus' },
          { race_id: race.id, wager_amount: 100000, reward: 10000, reward_type: 'bonus' },
        ]
      }
    })

    const { error: milestonesError } = await supabase
      .from('wager_race_milestones')
      .insert(milestonesToCreate)

    if (milestonesError) throw milestonesError

    return NextResponse.json({ 
      success: true, 
      message: 'Sample races created successfully',
      racesCount: races.length,
      milestonesCount: milestonesToCreate.length,
    })
  } catch (error) {
    console.error('Error seeding races:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to seed races'
    }, { status: 500 })
  }
}
