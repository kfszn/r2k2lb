import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/staff-auth'
import { sendKickChatDetailed } from '@/lib/kick/send-chat'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (getAdminSession(request)?.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const time = new Date().toISOString().slice(11, 19)
  const result = await sendKickChatDetailed(`Bot connection test (${time} UTC)`)
  return NextResponse.json(result, { status: result.ok ? 200 : 502 })
}
