import { NextResponse } from 'next/server'
import { adminClient, getAuthUser, getBalance } from '@/lib/games/r2koins'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = adminClient()
  const balance = await getBalance(admin, user.id)
  return NextResponse.json({ balance })
}
