import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { raceId, wagerAmount } = await req.json()

    if (!raceId || wagerAmount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get current race
    const { data: race, error: raceError } = await supabase
      .from('wager_races')
      .select('*')
      .eq('id', raceId)
      .single()

    if (raceError || !race) {
      return NextResponse.json({ error: 'Race not found' }, { status: 404 })
    }

    // Update wager amount
    const newWagerAmount = race.current_wager + wagerAmount
    const { data: updatedRace, error: updateError } = await supabase
      .from('wager_races')
      .update({ current_wager: newWagerAmount })
      .eq('id', raceId)
      .select()
      .single()

    if (updateError) throw updateError

    // Check if any milestones are now completed
    const { data: milestones, error: milestonesError } = await supabase
      .from('wager_race_milestones')
      .select('*')
      .eq('race_id', raceId)
      .order('wager_amount', { ascending: true })

    if (milestonesError) throw milestonesError

    // Process newly completed milestones
    const completedMilestones = []
    for (const milestone of milestones || []) {
      if (newWagerAmount >= milestone.wager_amount && !milestone.completed) {
        // Mark milestone as completed
        await supabase
          .from('wager_race_milestones')
          .update({ completed: true })
          .eq('id', milestone.id)

        completedMilestones.push(milestone)
      }
    }

    return NextResponse.json({
      success: true,
      race: updatedRace,
      completedMilestones,
    })
  } catch (error) {
    console.error('Error updating race wager:', error)
    return NextResponse.json(
      { error: 'Failed to update race wager' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const raceId = searchParams.get('raceId')

    if (!raceId) {
      return NextResponse.json(
        { error: 'Missing raceId parameter' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get race details
    const { data: race, error: raceError } = await supabase
      .from('wager_races')
      .select('*')
      .eq('id', raceId)
      .single()

    if (raceError || !race) {
      return NextResponse.json({ error: 'Race not found' }, { status: 404 })
    }

    // Get milestones
    const { data: milestones, error: milestonesError } = await supabase
      .from('wager_race_milestones')
      .select('*')
      .eq('race_id', raceId)
      .order('wager_amount', { ascending: true })

    if (milestonesError) throw milestonesError

    return NextResponse.json({
      race,
      milestones,
    })
  } catch (error) {
    console.error('Error fetching race data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch race data' },
      { status: 500 }
    )
  }
}
