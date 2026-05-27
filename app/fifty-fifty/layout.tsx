import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '50/50 Raffle — R2K2',
  description: 'Buy USDT tickets for the provably fair 50/50 raffle. The winner takes 50% of the total pot.',
}

export default function FiftyFiftyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
