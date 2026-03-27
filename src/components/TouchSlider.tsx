'use client'

import { useRef, useCallback } from 'react'

interface TouchSliderProps {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}

export default function TouchSlider({ value, onChange, min = 1, max = 10, step = 0.25 }: TouchSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const valueToPercent = (v: number) => ((v - min) / (max - min)) * 100
  const percentToValue = (pct: number) => {
    const raw = min + (pct / 100) * (max - min)
    const snapped = Math.round(raw / step) * step
    return Math.min(max, Math.max(min, snapped))
  }

  const getPercentFromEvent = useCallback((clientX: number) => {
    if (!trackRef.current) return 0
    const rect = trackRef.current.getBoundingClientRect()
    const pct = ((clientX - rect.left) / rect.width) * 100
    return Math.min(100, Math.max(0, pct))
  }, [])

  const handleStart = useCallback((clientX: number) => {
    isDragging.current = true
    const pct = getPercentFromEvent(clientX)
    onChange(percentToValue(pct))
  }, [getPercentFromEvent, onChange, min, max, step])

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging.current) return
    const pct = getPercentFromEvent(clientX)
    onChange(percentToValue(pct))
  }, [getPercentFromEvent, onChange, min, max, step])

  const handleEnd = useCallback(() => {
    isDragging.current = false
  }, [])

  const pct = valueToPercent(value)

  return (
    <div
      ref={trackRef}
      className="relative h-10 flex items-center cursor-pointer select-none"
      onMouseDown={(e) => { handleStart(e.clientX); e.preventDefault() }}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => { handleStart(e.touches[0].clientX); e.preventDefault() }}
      onTouchMove={(e) => { handleMove(e.touches[0].clientX); e.preventDefault() }}
      onTouchEnd={handleEnd}
      style={{ touchAction: 'none' }}
    >
      {/* Track background */}
      <div className="absolute left-0 right-0 h-2 rounded-full bg-warm-200">
        {/* Filled part */}
        <div className="absolute left-0 top-0 h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
      </div>
      {/* Thumb */}
      <div
        className="absolute w-7 h-7 rounded-full bg-primary border-[3px] border-white shadow-md -translate-x-1/2"
        style={{ left: `${pct}%` }}
      />
    </div>
  )
}
