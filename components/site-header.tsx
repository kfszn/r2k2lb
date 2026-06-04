'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, User, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function SiteHeader() {
  const [open, setOpen] = useState(false)
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

  return (
    <header className="border-b border-border/40 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="text-2xl font-bold">
            R2K2
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
          <Link href="/#platforms" className="text-sm font-medium hover:text-primary transition-colors">Leaderboards</Link>
          <Link href="/wager-races" className="text-sm font-medium hover:text-primary transition-colors">Wager Races</Link>
          <Link href="/raffle" className="text-sm font-medium hover:text-primary transition-colors">Raffle</Link>
          <span className="text-sm font-medium text-muted-foreground/40 cursor-default select-none">
            50/50 <span className="text-[10px] font-bold uppercase tracking-wider">Soon</span>
          </span>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="rounded-full h-9 w-9 p-0">
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
                  className="text-base font-medium hover:text-primary transition-colors py-2"
                  onClick={() => setOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  href="/#platforms" 
                  className="text-base font-medium hover:text-primary transition-colors py-2"
                  onClick={() => setOpen(false)}
                >
                  Leaderboards
                </Link>
                <Link 
                  href="/wager-races" 
                  className="text-base font-medium hover:text-primary transition-colors py-2"
                  onClick={() => setOpen(false)}
                >
                  Wager Races
                </Link>
                <Link 
                  href="/raffle" 
                  className="text-base font-medium hover:text-primary transition-colors py-2"
                  onClick={() => setOpen(false)}
                >
                  Raffle
                </Link>
                <div className="flex items-center justify-center gap-2 py-2 cursor-default select-none">
                  <span className="text-base font-medium text-muted-foreground/40">50/50</span>
                  <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-wider">Coming Soon</span>
                </div>
                <div className="pt-4 border-t border-border">
                  {user ? (
                    <div className="space-y-2">
                      <Link href="/account" onClick={() => setOpen(false)}>
                        <Button variant="outline" className="w-full gap-2">
                          <User className="h-4 w-4" />
                          My Account
                        </Button>
                      </Link>
                      <Button variant="ghost" className="w-full text-destructive gap-2" onClick={() => { handleSignOut(); setOpen(false) }}>
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Link href="/auth/login" onClick={() => setOpen(false)}>
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
