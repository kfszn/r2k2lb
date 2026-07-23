'use client'

import Link from 'next/link'
import {
  LayoutDashboard,
  Trophy,
  Gamepad2,
  Ticket,
  Settings,
  Users,
  BarChart3,
  ListOrdered,
  Zap,
  LineChart,
} from 'lucide-react'

export type AdminNavView =
  | 'dashboard'
  | 'tournament'
  | 'stream-games'
  | 'raffle'
  | 'shop'
  | 'users'
  | 'games'
  | 'leaderboards'
  | 'r2koins'
  | 'website'

const NAV_ITEMS: { view: AdminNavView; label: string; icon: React.ReactNode }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { view: 'tournament', label: 'Tournaments', icon: <Trophy className="h-4 w-4" /> },
  { view: 'stream-games', label: 'Stream Games', icon: <Gamepad2 className="h-4 w-4" /> },
  { view: 'raffle', label: 'Raffle', icon: <Ticket className="h-4 w-4" /> },
  { view: 'shop', label: 'Shop', icon: <Settings className="h-4 w-4" /> },
  { view: 'users', label: 'Users', icon: <Users className="h-4 w-4" /> },
  { view: 'games', label: 'Games', icon: <BarChart3 className="h-4 w-4" /> },
  { view: 'leaderboards', label: 'Leaderboards', icon: <ListOrdered className="h-4 w-4" /> },
  { view: 'r2koins', label: 'R2Koins', icon: <Zap className="h-4 w-4" /> },
  { view: 'website', label: 'Affiliates', icon: <LineChart className="h-4 w-4" /> },
]

export function AdminNav({
  current,
  onNavigate,
}: {
  current: AdminNavView
  onNavigate: (view: AdminNavView) => void
}) {
  return (
    <nav
      aria-label="Admin sections"
      className="mb-6 -mx-4 px-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex w-max items-center gap-1 rounded-xl border border-border/40 bg-card/60 p-1 backdrop-blur-xl">
        {NAV_ITEMS.map((item) => {
          const active = current === item.view
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition-all ${
                active
                  ? 'bg-primary text-primary-foreground shadow-[0_0_20px_-4px_rgba(80,120,255,0.7)]'
                  : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          )
        })}
        <Link
          href="/admin/fifty-fifty"
          className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-all hover:bg-muted/40 hover:text-foreground"
        >
          <Ticket className="h-4 w-4" />
          50/50
        </Link>
      </div>
    </nav>
  )
}
