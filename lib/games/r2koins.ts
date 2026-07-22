import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/** The single admin identity used across the app (matches header.tsx gating). */
export const ADMIN_EMAIL = 'business.r2k2@gmail.com'

/** Service-role client for privileged, server-only balance mutations. */
export function adminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/** Returns the authenticated user (via cookies) or null. */
export async function getAuthUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getBalance(admin: SupabaseClient, userId: string): Promise<number> {
  const { data } = await admin
    .from('r2koins_balance')
    .select('balance')
    .eq('kick_user_id', userId)
    .maybeSingle()
  return data ? Number(data.balance) : 0
}

/**
 * Atomically adjusts a user's R2Koins balance via the guarded RPC.
 * Pass a negative delta to deduct. Throws 'INSUFFICIENT_FUNDS' if the
 * resulting balance would be negative.
 */
export async function adjustBalance(
  admin: SupabaseClient,
  userId: string,
  delta: number,
): Promise<number> {
  const { data, error } = await admin.rpc('adjust_r2koins', {
    p_user: userId,
    p_delta: delta,
  })
  if (error) {
    if (error.message?.includes('INSUFFICIENT_FUNDS')) {
      throw new Error('INSUFFICIENT_FUNDS')
    }
    throw error
  }
  return Number(data)
}
