'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Coins, ChevronDown, ChevronUp, History } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface R2KoinsData {
  balance: number
  links: { platform: string; platform_username: string; linked_at: string }[]
  expirations: { expired_amount: number; expired_at: string }[]
}

export function R2KoinsCard() {
  const { data } = useSWR<R2KoinsData>('/api/r2koins/me', fetcher)
  const [historyOpen, setHistoryOpen] = useState(false)

  if (!data) return null

  const hasLinks = data.links.length > 0
  const hasHistory = data.expirations.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          R2Koins
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold text-primary">
            {data.balance.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground pb-1.5">
            R2Koins &middot; resets monthly
          </span>
        </div>

        {hasLinks ? (
          <div className="flex flex-wrap gap-2">
            {data.links.map((link) => (
              <Badge key={`${link.platform}-${link.platform_username}`} variant="outline" className="capitalize">
                {link.platform}: {link.platform_username}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No platform accounts linked yet. Open a ticket in Discord to link your Acebet or LuxDrop
            account and start earning R2Koins from your wagers.
          </p>
        )}

        {hasHistory && (
          <div className="border-t border-border pt-3">
            <button
              type="button"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setHistoryOpen((o) => !o)}
              aria-expanded={historyOpen}
            >
              <History className="h-4 w-4" />
              Expiration history
              {historyOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {historyOpen && (
              <ul className="mt-3 space-y-1.5">
                {data.expirations.map((exp, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex justify-between">
                    <span>
                      {Number(exp.expired_amount).toLocaleString()} R2Koins expired
                    </span>
                    <span>{new Date(exp.expired_at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
