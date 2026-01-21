'use client'

import React from "react"

import { useState, useRef, useEffect } from 'react'
import { X, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function KickMiniPlayer() {
  const [isVisible, setIsVisible] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const playerRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize position to bottom right on mount
  useEffect(() => {
    if (!isInitialized) {
      const updatePosition = () => {
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight
        const playerWidth = isExpanded ? 640 : 400
        const playerHeight = isExpanded ? 400 : 250
        
        setPosition({
          x: windowWidth - playerWidth - 20,
          y: windowHeight - playerHeight - 20,
        })
        setIsInitialized(true)
      }
      
      updatePosition()
      window.addEventListener('resize', updatePosition)
      return () => window.removeEventListener('resize', updatePosition)
    }
  }, [isExpanded, isInitialized])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (playerRef.current) {
      const rect = playerRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
      setIsDragging(true)
    }
  }

  if (!isVisible) return null

  return (
    <div
      ref={playerRef}
      className="fixed z-50 bg-background border-2 border-primary/40 rounded-lg shadow-2xl overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isExpanded ? '640px' : '320px',
        maxWidth: 'calc(100vw - 40px)',
      }}
    >
      {/* Header */}
      <div
        className="bg-secondary/80 backdrop-blur-sm px-3 py-2 flex items-center justify-between cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold">Live on Kick</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 hover:bg-destructive/20"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Player */}
      <div className="relative aspect-video bg-black">
        <iframe
          src="https://player.kick.com/r2ktwo"
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          title="R2Ktwo Kick Stream"
        />
      </div>

      {/* Footer */}
      <div className="bg-secondary/60 backdrop-blur-sm px-3 py-2">
        <a
          href="https://kick.com/R2Ktwo"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <span>Watch on Kick.com</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  )
}
