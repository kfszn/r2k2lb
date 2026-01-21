'use client'
import { useEffect } from 'react'

export default function RafflePage() {
  useEffect(() => {
    window.location.href = '/raffle.html'
  }, [])
  
  return null
}
