'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

export default function PageLoader() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const prevPathname = useRef(pathname)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const removeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startLoader = (duration: number) => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    if (removeTimer.current) clearTimeout(removeTimer.current)

    setVisible(true)
    setFadeOut(false)

    // Begin fade after the visible duration
    hideTimer.current = setTimeout(() => {
      setFadeOut(true)
      // Fully remove after the fade transition (350ms)
      removeTimer.current = setTimeout(() => setVisible(false), 350)
    }, duration)
  }

  // Initial load
  useEffect(() => {
    startLoader(1400)
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
      if (removeTimer.current) clearTimeout(removeTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Route changes
  useEffect(() => {
    if (prevPathname.current === pathname) return
    prevPathname.current = pathname
    startLoader(1200)
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
      <div className="flex flex-col items-center gap-5">
        <div className="logo-bounce">
          {/* Use a plain img so it renders instantly without Next image optimization delay */}
          <img
            src="/assets/logo.png"
            alt="R2K2 Logo"
            width={96}
            height={96}
            className="rounded-xl"
          />
        </div>
        <div className="flex gap-1.5">
          <span className="dot-pulse" style={{ animationDelay: '0ms' }} />
          <span className="dot-pulse" style={{ animationDelay: '150ms' }} />
          <span className="dot-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
