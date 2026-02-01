import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { milestoneId, playerName } = await req.json()

    if (!milestoneId || !playerName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get milestone and race info
    const { data: milestone, error: milestoneError } = await supabase
      .from('wager_race_milestones')
      .select('race_id')
      .eq('id', milestoneId)
      .single()

    if (milestoneError || !milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
    }

    // Create winner record
    const { data: winner, error: winnerError } = await supabase
      .from('wager_race_winners')
      .insert([
        {
          race_id: milestone.race_id,
          milestone_id: milestoneId,
          player_name: playerName,
          claimed_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (winnerError) throw winnerError

    return NextResponse.json({
      success: true,
      winner,
    })
  } catch (error) {
    console.error('Error locking winner:', error)
    return NextResponse.json(
      { error: 'Failed to lock winner' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const milestoneId = searchParams.get('milestoneId')

    if (!milestoneId) {
      return NextResponse.json(
        { error: 'Missing milestoneId parameter' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get winners for this milestone
    const { data: winners, error } = await supabase
      .from('wager_race_winners')
      .select('*')
      .eq('milestone_id', milestoneId)
      .order('claimed_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ winners })
  } catch (error) {
    console.error('Error fetching winners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch winners' },
      { status: 500 }
    )
  }
}
