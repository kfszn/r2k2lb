'use client'

import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  value: number | null
  format: (value: number) => string
  fallback?: string
  duration?: number
}

// Tweens from the currently shown value to the new one so changes roll instead of snapping.
export function AnimatedNumber({ value, format, fallback = '—', duration = 700 }: AnimatedNumberProps) {
  const [shown, setShown] = useState<number | null>(value)
  const shownRef = useRef<number | null>(value)

  useEffect(() => {
    const from = shownRef.current
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (value === null || from === null || from === value || reduceMotion) {
      shownRef.current = value
      setShown(value)
      return
    }

    const startedAt = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = progress === 1 ? value : from + (value - from) * eased
      shownRef.current = current
      setShown(current)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return <span className="tabular-nums">{shown === null ? fallback : format(shown)}</span>
}
