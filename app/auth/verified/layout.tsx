import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Email Verified',
  description: 'Your R2K2 account has been verified. Welcome to the community!',
  alternates: {
    canonical: '/auth/verified',
  },
}

export default function VerifiedLayout({ children }: { children: React.ReactNode }) {
  return children
}
