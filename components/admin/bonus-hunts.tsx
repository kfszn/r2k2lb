'use client'

import { useState } from 'react'
import { BonusHuntDetail } from '@/components/admin/bonus-hunt-detail'
import { BonusHuntOverview } from '@/components/admin/bonus-hunt-overview'
import { BonusHuntSettings } from '@/components/admin/bonus-hunt-settings'

export function BonusHunts() {
  const [openHuntId, setOpenHuntId] = useState<string | null>(null)

  if (openHuntId) return <BonusHuntDetail huntId={openHuntId} onBack={() => setOpenHuntId(null)} />

  return (
    <div className="flex flex-col gap-8">
      <BonusHuntOverview onOpen={setOpenHuntId} />
      <BonusHuntSettings />
    </div>
  )
}
