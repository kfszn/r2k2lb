'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'

const MIN_DISPLAY = 1400 // minimum time the loader stays on screen (ms)
const FADE_MS = 300 // fade-out transition duration (ms)

const LOADER_PHRASES = ['The Best User Experience', 'The Best Rewards On Roobet', 'For The Players']

function randomPhraseIndex(exclude?: number) {
  if (LOADER_PHRASES.length <= 1) return 0
  let next = Math.floor(Math.random() * LOADER_PHRASES.length)
  if (next === exclude) {
    next = (next + 1) % LOADER_PHRASES.length
  }
  return next
}

export default function PageLoader() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  // Start at a fixed index so server and client render the same phrase on first
  // paint (Math.random() during the initializer would differ between SSR and
  // hydration and trigger a hydration mismatch). Randomize only after mount.
  const [phraseIndex, setPhraseIndex] = useState(0)

  const shownAt = useRef<number>(Date.now())
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const removeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = () => {
    if (fadeTimer.current) clearTimeout(fadeTimer.current)
    if (removeTimer.current) clearTimeout(removeTimer.current)
  }

  // Show the loader immediately (called when navigation starts)
  const show = useCallback(() => {
    clearTimers()
    shownAt.current = Date.now()
    setFadeOut(false)
    setVisible(true)
    setPhraseIndex((prev) => randomPhraseIndex(prev))
  }, [])

  // Hide the loader, respecting the minimum display time
  const hide = useCallback(() => {
    const elapsed = Date.now() - shownAt.current
    const wait = Math.max(0, MIN_DISPLAY - elapsed)

    clearTimers()
    fadeTimer.current = setTimeout(() => {
      setFadeOut(true)
      removeTimer.current = setTimeout(() => setVisible(false), FADE_MS)
    }, wait)
  }, [])

  // Pick a random phrase for the initial load, but only after mount so the
  // server-rendered markup and the client's first render agree.
  useEffect(() => {
    setPhraseIndex((prev) => randomPhraseIndex(prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Detect navigation START via link clicks + browser back/forward.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // Respect modifier keys / non-left clicks (new tab, etc.)
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return
      }

      const anchor = (e.target as HTMLElement)?.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      const target = anchor.getAttribute('target')

      // Ignore external links, new tabs, downloads, hashes, and special protocols
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        target === '_blank' ||
        anchor.hasAttribute('download')
      ) {
        return
      }

      // External absolute URLs (different origin)
      try {
        const url = new URL(href, window.location.href)
        if (url.origin !== window.location.origin) return
        // Same page (only hash / identical path) — no navigation, skip
        if (url.pathname === window.location.pathname && url.search === window.location.search) {
          return
        }
      } catch {
        return
      }

      show()
    }

    const onPopState = () => show()

    document.addEventListener('click', onClick, true)
    window.addEventListener('popstate', onPopState)

    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', onPopState)
    }
  }, [show])

  // Hide once the new route has committed (pathname changed) + on initial mount.
  useEffect(() => {
    hide()
    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-300 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      aria-label="Loading"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="logo-bounce flex h-24 w-24 items-center justify-center">
          {/* Plain img so it renders instantly without Next image optimization delay */}
          <img
            src="/assets/logo.png"
            alt="R2K2 Logo"
            loading="eager"
            decoding="async"
            className="logo-glow h-24 w-24 object-contain"
          />
        </div>

        <div className="relative h-6 w-72 max-w-[85vw] text-center sm:w-96">
          <span
            key={`hollow-${phraseIndex}`}
            aria-hidden="true"
            className="loader-phrase-hollow absolute inset-0 block whitespace-nowrap text-balance font-sans text-sm font-bold sm:text-base"
          >
            {LOADER_PHRASES[phraseIndex]}
          </span>
          <span
            key={`fill-${phraseIndex}`}
            className="loader-phrase-fill absolute inset-0 block whitespace-nowrap text-balance font-sans text-sm font-bold sm:text-base"
          >
            {LOADER_PHRASES[phraseIndex]}
          </span>
        </div>
      </div>
    </div>
  )
}
