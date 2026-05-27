import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Email Verified | R2K2.GG',
  description: 'Your R2K2.GG account has been verified. Welcome to the community!',
}

export default function VerifiedLayout({ children }: { children: React.ReactNode }) {
  return children
}
