import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '50/50 Overlay',
  robots: 'noindex',
}

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return children
}
