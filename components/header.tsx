'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function Header() {
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

  const isAdmin = user?.email === 'business.r2k2@gmail.com'

  return (
    <header className="border-b border-border/40 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/assets/logo.png" alt="R2K2" width={48} height={48} className="rounded-lg" />
          <span className="text-2xl font-bold text-foreground">
            R<span className="text-foreground">2</span>K<span className="text-foreground">2</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
          <Link href="/#platforms" className="text-sm font-medium hover:text-primary transition-colors">Leaderboards</Link>
          <Link href="/raffle" className="text-sm font-medium hover:text-primary transition-colors">Raffle</Link>
          {isAdmin && (
            <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors">Admin</Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/account" className="hidden md:block">
                <Button size="sm" variant="outline" className="bg-transparent">
                  Account
                </Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={handleSignOut} className="hidden md:block">
                Sign Out
              </Button>
            </>
          ) : (
            <Link href="/auth/login" className="hidden md:block">
              <Button size="sm">
                Login
              </Button>
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
                  href="/raffle" 
                  className="text-base font-medium hover:text-primary transition-colors py-2"
                  onClick={() => setOpen(false)}
                >
                  Raffle
                </Link>
                {isAdmin && (
                  <Link 
                    href="/admin" 
                    className="text-base font-medium hover:text-primary transition-colors py-2"
                    onClick={() => setOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <div className="pt-4 border-t border-border">
                  {user ? (
                    <>
                      <Link href="/account" onClick={() => setOpen(false)}>
                        <Button className="w-full mb-2 bg-transparent" variant="outline">
                          Account
                        </Button>
                      </Link>
                      <Button className="w-full" variant="ghost" onClick={() => { handleSignOut(); setOpen(false); }}>
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <Link href="/auth/login" onClick={() => setOpen(false)}>
                      <Button className="w-full">
                        Login
                      </Button>
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
