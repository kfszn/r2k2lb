import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/staff-auth'
import { getHuntDb, loadOverview } from '@/lib/hunt/server'
import type { OverviewPeriod } from '@/lib/hunt/stats'

export const dynamic = 'force-dynamic'

const PERIODS: OverviewPeriod[] = ['all', '30d', '7d']

export async function GET(request: NextRequest) {
  if (!getAdminSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const requested = request.nextUrl.searchParams.get('period') as OverviewPeriod | null
  const period = requested && PERIODS.includes(requested) ? requested : 'all'

  return NextResponse.json(await loadOverview(getHuntDb(), period))
}
