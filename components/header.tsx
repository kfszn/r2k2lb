'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, ChevronDown, LogOut, User } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function Header() {
  const [open, setOpen] = useState(false)
  const [mobileAcebet, setMobileAcebet] = useState(false)
  const [mobilePoints, setMobilePoints] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isAdmin = user?.email === 'business.r2k2@gmail.com'

  const closeMobile = () => {
    setOpen(false)
    setMobileAcebet(false)
    setMobilePoints(false)
  }

  return (
    <header className="border-b border-border/30 bg-card/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 md:gap-3">
          <Image 
            src="/assets/logo.png" 
            alt="R2K2 Logo" 
            width={32} 
            height={32}
            className="w-8 h-8 object-contain"
          />
          <span className="font-bold text-base md:text-lg" style={{ textShadow: '0 0 8px rgba(59,130,246,0.9), 0 0 20px rgba(59,130,246,0.5)' }}>R2K2</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
            Home
          </Link>

          {/* Acebet Dropdown */}
          <div className="relative group">
            <button className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1 py-2">
              AceBet
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="absolute left-0 top-full hidden group-hover:block bg-card border border-border/40 rounded-lg shadow-lg min-w-[220px] z-50 py-1">
              <Link 
                href="/leaderboard/acebet" 
                className="block px-4 py-2 text-sm font-medium hover:text-primary hover:bg-secondary/50 transition-colors"
              >
                Leaderboard
              </Link>
              <Link 
                href="/tournament" 
                className="block px-4 py-2 text-sm font-medium hover:text-primary hover:bg-secondary/50 transition-colors"
              >
                Tournament
              </Link>
              <Link 
                href="/raffle" 
                className="block px-4 py-2 text-sm font-medium hover:text-primary hover:bg-secondary/50 transition-colors"
              >
                Raffle
              </Link>
              <div className="h-px bg-border/20 mx-2 my-1" />
              <div className="px-4 py-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                Code Perks
              </div>
              <Link 
                href="/perks/acebet/wager-rewards" 
                className="block px-4 py-2 text-sm font-medium hover:text-primary hover:bg-secondary/50 transition-colors"
              >
                Wager Rewards
              </Link>
              <Link 
                href="/perks/acebet/reward-match" 
                className="block px-4 py-2 text-sm font-medium hover:text-primary hover:bg-secondary/50 transition-colors flex items-center gap-2"
              >
                <span className="text-amber-400 text-xs font-bold">2x</span>
                Reward Match
              </Link>
              <Link 
                href="/perks/acebet/first-deposit" 
                className="block px-4 py-2 text-sm font-medium hover:text-primary hover:bg-secondary/50 transition-colors"
              >
                First Time Deposit Bonus
              </Link>
              <Link 
                href="/perks/acebet/loss-back" 
                className="block px-4 py-2 text-sm font-medium hover:text-primary hover:bg-secondary/50 transition-colors"
              >
                Loss-back
              </Link>
            </div>
          </div>

          {/* Points Dropdown */}
          <div className="relative group">
            <button className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1 py-2">
              Points
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="absolute left-0 top-full hidden group-hover:block bg-card border border-border/40 rounded-lg shadow-lg min-w-[180px] z-50 py-1">
              <Link
                href="/shop"
                className="block px-4 py-2 text-sm font-medium hover:text-primary hover:bg-secondary/50 transition-colors"
              >
                Shop
              </Link>
              <Link
                href="/games"
                className="block px-4 py-2 text-sm font-medium hover:text-primary hover:bg-secondary/50 transition-colors"
              >
                Games
              </Link>
              <div className="h-px bg-border/20 mx-2 my-1" />
              <Link
                href="/how-it-works"
                className="block px-4 py-2 text-sm font-medium hover:text-primary hover:bg-secondary/50 transition-colors"
              >
                How It Works
              </Link>
            </div>
          </div>
          
          <a href="https://discord.gg/r2k2" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-primary transition-colors">
            Discord
          </a>

          {isAdmin && (
            <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors text-yellow-600">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="rounded-full h-10 w-10 p-0">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm text-muted-foreground truncate">
                  {user.email}
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/account" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    My Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth/login" className="hidden md:block">
              <Button size="sm">Login</Button>
            </Link>
          )}

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button size="sm" variant="ghost">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
              <nav className="flex flex-col gap-4 mt-8">
                <Link 
                  href="/" 
                  className="text-base font-medium hover:text-primary transition-colors py-2 text-center"
                  onClick={closeMobile}
                >
                  Home
                </Link>

                {/* Mobile Acebet */}
                <div className="space-y-1">
                  <button 
                    onClick={() => setMobileAcebet(!mobileAcebet)}
                    className="text-base font-medium hover:text-primary transition-colors py-2 flex items-center justify-center gap-1 w-full"
                  >
                    AceBet
                    <ChevronDown className={`h-4 w-4 transition-transform ${mobileAcebet ? 'rotate-180' : ''}`} />
                  </button>
                  {mobileAcebet && (
                    <div className="flex flex-col gap-1 bg-secondary/30 rounded-lg p-3">
                      <Link href="/leaderboard/acebet" className="text-sm font-medium hover:text-primary transition-colors py-2 text-center" onClick={closeMobile}>
                        Leaderboard
                      </Link>
                      <Link href="/tournament" className="text-sm font-medium hover:text-primary transition-colors py-2 text-center" onClick={closeMobile}>
                        Tournament
                      </Link>
                      <Link href="/raffle" className="text-sm font-medium hover:text-primary transition-colors py-2 text-center" onClick={closeMobile}>
                        Raffle
                      </Link>
                      <div className="h-px bg-border/20 my-1" />
                      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider text-center">Code Perks</p>
                      <Link href="/perks/acebet/wager-rewards" className="text-sm font-medium hover:text-primary transition-colors py-2 text-center" onClick={closeMobile}>
                        Wager Rewards
                      </Link>
                      <Link href="/perks/acebet/reward-match" className="text-sm font-medium hover:text-primary transition-colors py-2 text-center flex items-center justify-center gap-1.5" onClick={closeMobile}>
                        <span className="text-amber-400 text-xs font-bold">2x</span>
                        Reward Match
                      </Link>
                      <Link href="/perks/acebet/first-deposit" className="text-sm font-medium hover:text-primary transition-colors py-2 text-center" onClick={closeMobile}>
                        First Time Deposit Bonus
                      </Link>
                      <Link href="/perks/acebet/loss-back" className="text-sm font-medium hover:text-primary transition-colors py-2 text-center" onClick={closeMobile}>
                        Loss-back
                      </Link>
                    </div>
                  )}
                </div>

                {/* Mobile Points */}
                <div className="space-y-1">
                  <button
                    onClick={() => { setMobilePoints(!mobilePoints); setMobileAcebet(false) }}
                    className="text-base font-medium hover:text-primary transition-colors py-2 flex items-center justify-center gap-1 w-full"
                  >
                    Points
                    <ChevronDown className={`h-4 w-4 transition-transform ${mobilePoints ? 'rotate-180' : ''}`} />
                  </button>
                  {mobilePoints && (
                    <div className="flex flex-col gap-1 bg-secondary/30 rounded-lg p-3">
                      <Link href="/shop" className="text-sm font-medium hover:text-primary transition-colors py-2 text-center" onClick={closeMobile}>
                        Shop
                      </Link>
                      <Link href="/games" className="text-sm font-medium hover:text-primary transition-colors py-2 text-center" onClick={closeMobile}>
                        Games
                      </Link>
                      <div className="h-px bg-border/20 my-1" />
                      <Link href="/how-it-works" className="text-sm font-medium hover:text-primary transition-colors py-2 text-center" onClick={closeMobile}>
                        How It Works
                      </Link>
                    </div>
                  )}
                </div>

                <a 
                  href="https://discord.gg/r2k2" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-base font-medium hover:text-primary transition-colors py-2 text-center"
                >
                  Discord
                </a>

                {isAdmin && (
                  <Link href="/admin" className="text-base font-medium hover:text-primary transition-colors py-2 text-center text-yellow-600" onClick={closeMobile}>
                    Admin
                  </Link>
                )}

                <div className="pt-4 border-t border-border">
                  {user ? (
                    <div className="flex flex-col gap-2">
                      <Link href="/account" onClick={closeMobile}>
                        <Button variant="outline" className="w-full bg-transparent">
                          <User className="h-4 w-4 mr-2" />
                          My Account
                        </Button>
                      </Link>
                      <Button onClick={handleSignOut} variant="destructive" className="w-full">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Link href="/auth/login" onClick={closeMobile}>
                      <Button className="w-full">Login</Button>
                    </Link>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export { Header }
export default Header
