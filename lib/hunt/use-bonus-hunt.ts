'use client'

import useSWR from 'swr'
import type { HuntEntry, HuntOverview, HuntSettings, HuntStats, HuntSummary, OverviewPeriod } from '@/lib/hunt/stats'

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
export function useBonusHunt(huntId?: string | null) {
  const url = huntId ? `/api/admin/bonus-hunt?hunt=${encodeURIComponent(huntId)}` : '/api/admin/bonus-hunt'
  return useSWR<AdminHuntState>(url, fetcher, { refreshInterval: 4000, keepPreviousData: true })
}

export function useHuntOverview(period: OverviewPeriod) {
  return useSWR<HuntOverview>(`/api/admin/bonus-hunt/overview?period=${period}`, fetcher, {
    refreshInterval: 8000,
    keepPreviousData: true,
  })
}

export function useKnownSlots() {
  return useSWR<{ slots: KnownSlot[] }>('/api/admin/bonus-hunt/slots', fetcher)
}

export async function huntRequest(
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  url: string,
  body?: Record<string, unknown>
): Promise<{ ok: boolean; error?: string; data?: Record<string, unknown> }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: string }
    return res.ok ? { ok: true, data } : { ok: false, error: data.error ?? 'Request failed.' }
  } catch {
    return { ok: false, error: 'Network error, try again.' }
  }
}
