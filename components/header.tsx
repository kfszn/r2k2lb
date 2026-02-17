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
  const [mobilePackdraw, setMobilePackdraw] = useState(false)
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
    setMobilePackdraw(false)
  }

  return (
    <header className="border-b border-border/40 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 md:gap-3">
          <Image 
            src="/assets/logo.png" 
            alt="R2K2 Logo" 
            width={32} 
            height={32}
            className="w-8 h-8 object-contain"
          />
          <span className="font-bold text-base md:text-lg">R2K2</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
            Home
          </Link>

          {/* Acebet Dropdown */}
          <div className="relative group">
            <button className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              Acebet
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="absolute left-0 mt-0 hidden group-hover:block bg-card border border-border/40 rounded-lg shadow-lg min-w-[220px] z-50 py-1">
              <Link 
                href="/leaderboard/acebet" 
                className="block px-4 py-2 text-sm font-medium hover:text-primary hover:bg-secondary/50 transition-colors"
              >
                Leaderboard
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

          {/* Packdraw Dropdown */}
          <div className="relative group">
            <button className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              Packdraw
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="absolute left-0 mt-0 hidden group-hover:block bg-card border border-border/40 rounded-lg shadow-lg min-w-[220px] z-50 py-1">
              <Link 
                href="/leaderboard/packdraw" 
                className="block px-4 py-2 text-sm font-medium hover:text-primary hover:bg-secondary/50 transition-colors"
              >
                Leaderboard
              </Link>
              <div className="h-px bg-border/20 mx-2 my-1" />
              <div className="px-4 py-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                Code Perks
              </div>
              <Link 
                href="/perks/packdraw/wager-rewards" 
                className="block px-4 py-2 text-sm font-medium hover:text-primary hover:bg-secondary/50 transition-colors"
              >
                Wager Rewards
              </Link>
              <Link 
                href="/perks/packdraw/first-time-deposit-bonus" 
                className="block px-4 py-2 text-sm font-medium hover:text-primary hover:bg-secondary/50 transition-colors"
              >
                First Time Deposit Bonus
              </Link>
              <Link 
                href="/perks/packdraw/loss-back" 
                className="block px-4 py-2 text-sm font-medium hover:text-primary hover:bg-secondary/50 transition-colors"
              >
                Loss-back
              </Link>
            </div>
          </div>

          <Link href="/raffle" className="text-sm font-medium hover:text-primary transition-colors">
            Raffle
          </Link>

          <Link href="/tournament" className="text-sm font-medium hover:text-primary transition-colors">
            Tournament
          </Link>
          
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
          ) : null}

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
                    onClick={() => { setMobileAcebet(!mobileAcebet); setMobilePackdraw(false) }}
                    className="text-base font-medium hover:text-primary transition-colors py-2 flex items-center justify-center gap-1 w-full"
                  >
                    Acebet
                    <ChevronDown className={`h-4 w-4 transition-transform ${mobileAcebet ? 'rotate-180' : ''}`} />
                  </button>
                  {mobileAcebet && (
                    <div className="flex flex-col gap-1 bg-secondary/30 rounded-lg p-3">
                      <Link href="/leaderboard/acebet" className="text-sm font-medium hover:text-primary transition-colors py-2 text-center" onClick={closeMobile}>
                        Leaderboard
                      </Link>
                      <div className="h-px bg-border/20 my-1" />
                      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider text-center">Code Perks</p>
                      <Link href="/perks/acebet/wager-rewards" className="text-sm font-medium hover:text-primary transition-colors py-2 text-center" onClick={closeMobile}>
                        Wager Rewards
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

                {/* Mobile Packdraw */}
                <div className="space-y-1">
                  <button 
                    onClick={() => { setMobilePackdraw(!mobilePackdraw); setMobileAcebet(false) }}
                    className="text-base font-medium hover:text-primary transition-colors py-2 flex items-center justify-center gap-1 w-full"
                  >
                    Packdraw
                    <ChevronDown className={`h-4 w-4 transition-transform ${mobilePackdraw ? 'rotate-180' : ''}`} />
                  </button>
                  {mobilePackdraw && (
                    <div className="flex flex-col gap-1 bg-secondary/30 rounded-lg p-3">
                      <Link href="/leaderboard/packdraw" className="text-sm font-medium hover:text-primary transition-colors py-2 text-center" onClick={closeMobile}>
                        Leaderboard
                      </Link>
                      <div className="h-px bg-border/20 my-1" />
                      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider text-center">Code Perks</p>
                      <Link href="/perks/packdraw/wager-rewards" className="text-sm font-medium hover:text-primary transition-colors py-2 text-center" onClick={closeMobile}>
                        Wager Rewards
                      </Link>
                      <Link href="/perks/packdraw/first-time-deposit-bonus" className="text-sm font-medium hover:text-primary transition-colors py-2 text-center" onClick={closeMobile}>
                        First Time Deposit Bonus
                      </Link>
                      <Link href="/perks/packdraw/loss-back" className="text-sm font-medium hover:text-primary transition-colors py-2 text-center" onClick={closeMobile}>
                        Loss-back
                      </Link>
                    </div>
                  )}
                </div>

                <Link href="/raffle" className="text-base font-medium hover:text-primary transition-colors py-2 text-center" onClick={closeMobile}>
                  Raffle
                </Link>

                <Link href="/tournament" className="text-base font-medium hover:text-primary transition-colors py-2 text-center" onClick={closeMobile}>
                  Tournament
                </Link>

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

                {user && (
                  <div className="pt-4 border-t border-border">
                    <Button onClick={handleSignOut} className="w-full">
                      Sign Out
                    </Button>
                  </div>
                )}
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
