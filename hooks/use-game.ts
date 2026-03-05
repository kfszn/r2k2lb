'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useGameSeeds() {
  return useSWR('/api/games/seeds', fetcher)
}

export function useGameHistory() {
  return useSWR('/api/games/history', fetcher, { refreshInterval: 0 })
}

export function useProfile() {
  return useSWR('/api/games/profile', fetcher)
}
