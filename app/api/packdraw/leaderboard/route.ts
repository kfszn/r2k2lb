import { NextResponse } from 'next/server'

const PACKDRAW_API_KEY = 'edadb58b-ea99-4c27-9b91-60b84c095ee9'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const after = searchParams.get('after')
  
  try {
    let url = `https://packdraw.com/api/v1/affiliates/leaderboard?apiKey=${PACKDRAW_API_KEY}`
    
    if (after) {
      url += `&after=${after}`
    }
    
    const res = await fetch(url)
    const data = await res.json()
    
    // Packdraw API returns: { after, before, asOf, leaderboard: [...] }
    if (data.leaderboard && Array.isArray(data.leaderboard)) {
      const transformedData = data.leaderboard.map((user: { username?: string; name?: string; wagered?: number; wagerAmount?: number; image?: string }, index: number) => ({
        name: user.username || user.name || `User ${index + 1}`,
        wagered: user.wagerAmount ?? user.wagered ?? 0,
        avatar: user.image || null,
        ...user
      }))
      
      return NextResponse.json({
        ok: true,
        count: transformedData.length,
        data: transformedData,
        range: {
          start_at: data.after || after || new Date().toISOString().split('T')[0],
          end_at: data.before || new Date().toISOString().split('T')[0],
          days: 30
        }
      })
    }
    
    // If it returns array directly
    if (Array.isArray(data)) {
      const transformedData = data.map((user: { username?: string; name?: string; wagered?: number; wagerAmount?: number; image?: string }, index: number) => ({
        name: user.username || user.name || `User ${index + 1}`,
        wagered: user.wagerAmount ?? user.wagered ?? 0,
        avatar: user.image || null,
        ...user
      }))
      
      return NextResponse.json({
        ok: true,
        count: transformedData.length,
        data: transformedData,
        range: {
          start_at: after || new Date().toISOString().split('T')[0],
          end_at: new Date().toISOString().split('T')[0],
          days: 30
        }
      })
    }
    
    // If it already has the expected format
    if (data.ok !== undefined) {
      return NextResponse.json(data)
    }
    
    return NextResponse.json({
      ok: false,
      error: 'Unexpected API response format'
    })
    
  } catch (error) {
    console.error('[v0] Packdraw API error:', error)
    return NextResponse.json({
      ok: false,
      error: 'Failed to fetch Packdraw leaderboard'
    }, { status: 500 })
  }
}
