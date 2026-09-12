'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'

type AccentColor = 'amber' | 'purple' | 'green' | 'blue'

const ACCENT_STYLES: Record<AccentColor, { border: string; icon: string; trigger: string }> = {
  amber: {
    border: 'border-amber-500/30',
    icon: 'text-amber-400',
    trigger: 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15',
  },
  purple: {
    border: 'border-violet-500/30',
    icon: 'text-violet-400',
    trigger: 'border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/15',
  },
  green: {
    border: 'border-emerald-500/30',
    icon: 'text-emerald-400',
    trigger: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15',
  },
  blue: {
    border: 'border-sky-500/30',
    icon: 'text-sky-400',
    trigger: 'border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/15',
  },
}

interface CollapsiblePanelProps {
  icon: ReactNode
  title: string
  accent: AccentColor
  triggerLabel: string
  defaultOpen?: boolean
  badges?: ReactNode
  children: ReactNode
}

/**
 * Reusable collapsible panel shell used for every account-page portal
 * section (Profile Settings, Rewards & Claims, Rewards Summary, and any
 * future section — referrals, Discord roles, lossback — that slots in
 * later without needing another rewrite of this shell).
 */
export function CollapsiblePanel({
  icon,
  title,
  accent,
  triggerLabel,
  defaultOpen = false,
  badges,
  children,
}: CollapsiblePanelProps) {
  const [open, setOpen] = useState(defaultOpen)
  const styles = ACCENT_STYLES[accent]

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={`rounded-xl border ${styles.border} bg-card/50 backdrop-blur-sm overflow-hidden`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={styles.icon}>{icon}</span>
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {badges}
        </div>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${styles.trigger}`}
          >
            {triggerLabel}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="border-t border-border/30 px-5 py-5 space-y-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}
