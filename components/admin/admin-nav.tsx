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
  LineChart,
  Flame,
  Gift,
  ShieldCheck,
  LogOut,
} from 'lucide-react'

export type AdminNavView =
  | 'dashboard'
  | 'tournament'
  | 'stream-games'
  | 'raffle'
  | 'shop'
  | 'challenges'
  | 'users'
  | 'games'
  | 'leaderboards'
  | 'website'
  | 'rewards'
  | 'staff-access'

export type AdminRole = 'owner' | 'staff'

const NAV_ITEMS: { view: AdminNavView; label: string; icon: React.ReactNode }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { view: 'tournament', label: 'Tournaments', icon: <Trophy className="h-4 w-4" /> },
  { view: 'stream-games', label: 'Stream Games', icon: <Gamepad2 className="h-4 w-4" /> },
  { view: 'raffle', label: 'Raffle', icon: <Ticket className="h-4 w-4" /> },
  { view: 'shop', label: 'Shop', icon: <Settings className="h-4 w-4" /> },
  { view: 'challenges', label: 'Challenges', icon: <Flame className="h-4 w-4" /> },
  { view: 'rewards', label: 'Rewards', icon: <Gift className="h-4 w-4" /> },
  { view: 'users', label: 'Users', icon: <Users className="h-4 w-4" /> },
  { view: 'games', label: 'Games', icon: <BarChart3 className="h-4 w-4" /> },
  { view: 'leaderboards', label: 'Leaderboards', icon: <ListOrdered className="h-4 w-4" /> },
  { view: 'website', label: 'Affiliates', icon: <LineChart className="h-4 w-4" /> },
  { view: 'staff-access', label: 'Staff Access', icon: <ShieldCheck className="h-4 w-4" /> },
]

// Staff logins only ever see Rewards and Users — everything else (including
// the dashboard grid and the 50/50 link) is owner-only.
const STAFF_VIEWS: AdminNavView[] = ['rewards', 'users']

export function AdminNav({
  current,
  onNavigate,
  role = 'owner',
  username,
  onLogout,
}: {
  current: AdminNavView
  onNavigate: (view: AdminNavView) => void
  role?: AdminRole
  username?: string
  onLogout?: () => void
}) {
  const items = role === 'staff' ? NAV_ITEMS.filter((item) => STAFF_VIEWS.includes(item.view)) : NAV_ITEMS

  return (
    <nav
      aria-label="Admin sections"
      className="mb-6 flex flex-wrap items-center justify-between gap-2"
    >
      <div className="-mx-4 flex-1 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max items-center gap-1 rounded-xl border border-border/40 bg-card/60 p-1 backdrop-blur-xl">
          {items.map((item) => {
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
          {role === 'owner' && (
            <Link
              href="/admin/fifty-fifty"
              className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-all hover:bg-muted/40 hover:text-foreground"
            >
              <Ticket className="h-4 w-4" />
              50/50
            </Link>
          )}
        </div>
      </div>
      {onLogout && (
        <button
          onClick={onLogout}
          className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-border/40 bg-card/60 px-3.5 py-2 text-sm font-semibold text-muted-foreground backdrop-blur-xl transition-all hover:bg-muted/40 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          {username ? `Log out (${username})` : 'Log out'}
        </button>
      )}
    </nav>
  )
}
