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
    
    console.log('[v0] Packdraw API call:', url.replace(PACKDRAW_API_KEY, '***'))
    
    const res = await fetch(url)
    const data = await res.json()
    
    console.log('[v0] Packdraw API response:', JSON.stringify(data).substring(0, 200))
    
    // Transform data to match expected format
    if (Array.isArray(data)) {
      // API returns array of users directly
      const transformedData = data.map((user: { name?: string; wagered?: number }, index: number) => ({
        name: user.name || `User ${index + 1}`,
        wagered: user.wagered || 0,
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
    
    // Unknown format
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
