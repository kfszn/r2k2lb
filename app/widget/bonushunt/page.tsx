import type { Metadata } from 'next'
import { BonusHuntWidget } from '@/components/widget/bonus-hunt-widget'

export const metadata: Metadata = {
  title: 'Bonus Hunt Widget',
  robots: { index: false, follow: false },
}

// The root layout adds an age gate, loader, footer and background to every page; hide them so OBS gets a clean transparent source.
const OBS_OVERRIDES = `
  html, body { background: transparent !important; min-height: 0 !important; overflow: hidden; }
  body { display: block !important; pointer-events: auto !important; }
  body > :not([data-widget-root]) { display: none !important; }
`

export default function BonusHuntWidgetPage() {
  return (
    <main data-widget-root className="p-2">
      <style>{OBS_OVERRIDES}</style>
      <BonusHuntWidget />
    </main>
  )
}
