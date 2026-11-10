'use client'

import useSWR from 'swr'
import type { HuntEntry, HuntSettings, HuntStats, HuntSummary } from '@/lib/hunt/stats'

export interface AdminHuntState {
  settings: HuntSettings
  hunt: HuntSummary | null
  entries: HuntEntry[]
  stats: HuntStats | null
}

export interface KnownSlot {
  key: string
  name: string
  imageUrl: string | null
}

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(res.status === 401 ? 'Your admin session expired, sign in again.' : 'Could not load bonus hunt data.')
  return res.json() as Promise<T>
}

// Polls so calls added from chat show up without a refresh.
export function useBonusHunt() {
  return useSWR<AdminHuntState>('/api/admin/bonus-hunt', fetcher, { refreshInterval: 4000, keepPreviousData: true })
}

export function useKnownSlots() {
  return useSWR<{ slots: KnownSlot[] }>('/api/admin/bonus-hunt/slots', fetcher)
}

export async function huntRequest(
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  url: string,
  body?: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    return res.ok ? { ok: true } : { ok: false, error: data.error ?? 'Request failed.' }
  } catch {
    return { ok: false, error: 'Network error, try again.' }
  }
}
