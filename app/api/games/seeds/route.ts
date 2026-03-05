import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { generateServerSeed, hashServerSeed } from '@/lib/games/provably-fair'
import crypto from 'crypto'

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getProfile() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = getServiceSupabase()
  const { data: profile } = await admin
    .from('profiles')
    .select('id, points')
    .eq('id', user.id)
    .single()
  return profile
}

// GET — return current seeds for user, creating if none exist
export async function GET() {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = getServiceSupabase()
  const { data: seeds } = await admin
    .from('user_seeds')
    .select('client_seed, nonce, active_server_seed_hash, next_server_seed_hash')
    .eq('profile_id', profile.id)
    .single()

  if (seeds) {
    return NextResponse.json({
      client_seed: seeds.client_seed,
      nonce: seeds.nonce,
      active_server_seed_hash: seeds.active_server_seed_hash,
      next_server_seed_hash: seeds.next_server_seed_hash,
    })
  }

  // Create initial seeds
  const activeSeed = generateServerSeed()
  const nextSeed = generateServerSeed()
  const clientSeed = crypto.randomBytes(16).toString('hex')

  await admin.from('user_seeds').insert({
    profile_id: profile.id,
    client_seed: clientSeed,
    nonce: 0,
    active_server_seed: activeSeed,
    active_server_seed_hash: hashServerSeed(activeSeed),
    next_server_seed: nextSeed,
    next_server_seed_hash: hashServerSeed(nextSeed),
  })

  return NextResponse.json({
    client_seed: clientSeed,
    nonce: 0,
    active_server_seed_hash: hashServerSeed(activeSeed),
    next_server_seed_hash: hashServerSeed(nextSeed),
  })
}

// POST — rotate seeds (reveals old server seed, rolls in next, generates new next)
export async function POST(req: NextRequest) {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const newClientSeed = body.client_seed?.trim() || crypto.randomBytes(16).toString('hex')

  const admin = getServiceSupabase()
  const { data: seeds } = await admin
    .from('user_seeds')
    .select('*')
    .eq('profile_id', profile.id)
    .single()

  if (!seeds) return NextResponse.json({ error: 'no seeds found' }, { status: 404 })

  const newNextSeed = generateServerSeed()

  await admin.from('user_seeds').update({
    client_seed: newClientSeed,
    nonce: 0,
    active_server_seed: seeds.next_server_seed,
    active_server_seed_hash: seeds.next_server_seed_hash,
    next_server_seed: newNextSeed,
    next_server_seed_hash: hashServerSeed(newNextSeed),
    updated_at: new Date().toISOString(),
  }).eq('profile_id', profile.id)

  return NextResponse.json({
    revealed_server_seed: seeds.active_server_seed,
    client_seed: newClientSeed,
    nonce: 0,
    active_server_seed_hash: seeds.next_server_seed_hash,
    next_server_seed_hash: hashServerSeed(newNextSeed),
  })
}
