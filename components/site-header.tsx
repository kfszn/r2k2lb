'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { useState } from 'react'

export default function SiteHeader() {
  const [open, setOpen] = useState(false)

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
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="hidden md:block">
            <Button size="sm">
              Login
            </Button>
          </Link>
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
                <div className="pt-4 border-t border-border">
                  <Link href="/auth/login" onClick={() => setOpen(false)}>
                    <Button className="w-full">
                      Login
                    </Button>
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
