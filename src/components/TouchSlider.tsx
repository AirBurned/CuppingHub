'use client'

import { useRef, useCallback } from 'react'

interface TouchSliderProps {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}

function getGradientColor(pct: number): string {
  // 0% = red, 50% = yellow, 100% = green
  if (pct <= 50) {
    const r = 220
    const g = Math.round(40 + (180 * pct) / 50) // 40 → 220
    const b = 40
    return `rgb(${r}, ${g}, ${b})`
  } else {
    const r = Math.round(220 - (180 * (pct - 50)) / 50) // 220 → 40
    const g = 200
    const b = 40
    return `rgb(${r}, ${g}, ${b})`
  }
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
      {/* Track background with gradient */}
      <div className="absolute left-0 right-0 h-2 rounded-full bg-warm-200 overflow-hidden">
        <div className="absolute inset-0 rounded-full opacity-30"
          style={{ background: 'linear-gradient(to right, #dc4040, #dcdc40, #40c840)' }} />
        {/* Filled part */}
        <div className="absolute left-0 top-0 h-full rounded-full transition-colors duration-150"
          style={{ width: `${pct}%`, backgroundColor: getGradientColor(pct) }} />
      </div>
      {/* Thumb */}
      <div
        className="absolute w-7 h-7 rounded-full border-[3px] border-white shadow-md -translate-x-1/2 transition-colors duration-150"
        style={{ left: `${pct}%`, backgroundColor: getGradientColor(pct) }}
      />
    </div>
  )
}
