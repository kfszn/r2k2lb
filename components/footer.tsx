import Link from 'next/link'
import Image from 'next/image'
import { Twitter, Instagram } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-border/30 bg-card/50 backdrop-blur mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/assets/logo.png" alt="R2K2 Logo" width={28} height={28} className="w-7 h-7 object-contain" />
              <span className="font-bold text-base">R2K2</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Official hub for R2K2 — leaderboards, tournaments, perks, and rewards.
            </p>
          </div>

          {/* AceBet Sign Up */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">AceBet</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sign up on AceBet with code <span className="font-bold text-primary">R2K2</span> to unlock exclusive perks, rewards, and leaderboard eligibility.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="https://www.acebet.co/welcome/r/r2k2"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Sign Up with Code R2K2 &rarr;
              </a>
              <Link
                href="/leaderboard/acebet"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                View Leaderboard &rarr;
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/leaderboard/acebet" className="hover:text-foreground transition-colors">AceBet Leaderboard</Link></li>
              <li><Link href="/perks/acebet/wager-rewards" className="hover:text-foreground transition-colors">Wager Rewards</Link></li>
              <li><Link href="/perks/acebet/reward-match" className="hover:text-foreground transition-colors">Reward Match</Link></li>
              <li><Link href="/perks/acebet/loss-back" className="hover:text-foreground transition-colors">Loss-back</Link></li>
              <li><Link href="/perks/acebet/first-deposit" className="hover:text-foreground transition-colors">First Deposit Bonus</Link></li>
              <li><Link href="/shop" className="hover:text-foreground transition-colors">Points Shop</Link></li>
            </ul>
          </div>

          {/* Socials */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Socials</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://x.com/R2ktwo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary group-hover:bg-secondary/80 transition-colors">
                    <Twitter className="h-4 w-4" />
                  </div>
                  <span>@R2ktwo</span>
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/R2KtwoKick"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary group-hover:bg-secondary/80 transition-colors">
                    <Instagram className="h-4 w-4" />
                  </div>
                  <span>@R2KtwoKick</span>
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/r2k2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary group-hover:bg-secondary/80 transition-colors">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.003.028.018.057.04.074a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                    </svg>
                  </div>
                  <span>discord.gg/r2k2</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground/60">
          <p>&copy; {new Date().getFullYear()} R2K2. All rights reserved.</p>
          <p>Not affiliated with AceBet. Gamble responsibly. 18+.</p>
        </div>
      </div>
    </footer>
  )
}
