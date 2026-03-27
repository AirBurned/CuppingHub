'use client'

import { spiderKeys, spiderLabels } from '@/lib/constants'

const COLORS = [
  '#f0c403', '#EF4444', '#3B82F6', '#22C55E', '#EC4899',
  '#8B5CF6', '#F97316', '#06B6D4', '#6366F1',
]

interface EvalData {
  user: { name: string }
  [key: string]: unknown
}

interface SpiderGraphProps {
  evaluations: EvalData[]
  maxValue?: number
  compact?: boolean
}

// Readable short labels for compact mode
const shortLabels: Record<string, string> = {
  aromaGround: 'Ар.С',
  aromaBrewed: 'Ар.З',
  flavor: 'Вкус',
  aftertaste: 'Послвк',
  acidity: 'Кисл',
  body: 'Тело',
  sweetness: 'Слад',
  cleanCup: 'Чист',
  overall: 'Общ',
  aftertasteDuration: 'П.длит',
  aftertastePleasantness: 'П.приятн',
}

export default function SpiderGraph({ evaluations, maxValue = 10, compact = false }: SpiderGraphProps) {
  const keys = spiderKeys.filter((k) =>
    evaluations.some((e) => e[k] !== null && e[k] !== undefined)
  )

  if (keys.length === 0) return compact ? null : <p className="text-sm text-warm-500 text-center">Нет данных</p>

  // Full mode: large viewBox with plenty of padding for labels
  // Compact mode: small for thumbnail
  const size = compact ? 200 : 500
  const center = size / 2
  const radius = compact ? 60 : 140
  const levels = compact ? 3 : 5

  function getPoint(index: number, value: number): [number, number] {
    const angle = (Math.PI * 2 * index) / keys.length - Math.PI / 2
    const r = (value / maxValue) * radius
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)]
  }

  function getPolygonPoints(values: number[]): string {
    return values.map((v, i) => getPoint(i, v).join(',')).join(' ')
  }

  const gridLevels = Array.from({ length: levels }, (_, i) => ((i + 1) / levels) * maxValue)

  const avgValues = keys.map((key) => {
    const vals = evaluations.map((e) => e[key] as number).filter((v) => v !== null && v !== undefined)
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0
  })

  // Calculate label positions with generous padding
  function getLabelPos(index: number): { x: number; y: number; anchor: 'start' | 'middle' | 'end' } {
    const angle = (Math.PI * 2 * index) / keys.length - Math.PI / 2
    const labelR = radius + (compact ? 18 : 35)
    const x = center + labelR * Math.cos(angle)
    const y = center + labelR * Math.sin(angle)
    const cosA = Math.cos(angle)
    const anchor = (cosA < -0.2 ? 'end' : cosA > 0.2 ? 'start' : 'middle') as 'end' | 'start' | 'middle'
    return { x, y, anchor }
  }

  return (
    <div className={`flex flex-col items-center ${compact ? '' : 'px-8 py-4'}`}>
      <svg viewBox={`-60 -30 ${size + 120} ${size + 60}`} overflow="visible" className={compact ? 'w-full h-full' : 'w-full max-w-lg'} style={{ overflow: 'visible' }}>
        {/* Grid levels */}
        {gridLevels.map((level) => (
          <polygon key={level}
            points={keys.map((_, i) => getPoint(i, level).join(',')).join(' ')}
            fill="none" stroke="#e8e6e1" strokeWidth={compact ? 0.5 : 1} />
        ))}

        {/* Axes */}
        {keys.map((_, i) => {
          const [x, y] = getPoint(i, maxValue)
          return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#e8e6e1" strokeWidth={compact ? 0.5 : 1} />
        })}

        {/* Labels — full mode */}
        {!compact && keys.map((key, i) => {
          const { x, y, anchor } = getLabelPos(i)
          return (
            <text key={key} x={x} y={y} textAnchor={anchor} dominantBaseline="central"
              style={{ fontSize: '13px', fill: '#3a3a3a', fontWeight: 600 }}>
              {spiderLabels[key]}
            </text>
          )
        })}

        {/* Labels — compact mode */}
        {compact && keys.map((key, i) => {
          const { x, y, anchor } = getLabelPos(i)
          return (
            <text key={key} x={x} y={y} textAnchor={anchor} dominantBaseline="central"
              style={{ fontSize: '11px', fill: '#6a6a6a', fontWeight: 600 }}>
              {shortLabels[key] || key.slice(0, 3)}
            </text>
          )
        })}

        {/* Average polygon — bold black */}
        <polygon points={getPolygonPoints(avgValues)}
          fill="rgba(10,10,10,0.08)" stroke="#0a0a0a" strokeWidth={compact ? 1.5 : 2.5} />

        {/* Individual evaluations */}
        {evaluations.map((ev, idx) => {
          const values = keys.map((key) => (ev[key] as number) ?? 5)
          return (
            <polygon key={idx} points={getPolygonPoints(values)}
              fill={`${COLORS[idx % COLORS.length]}15`} stroke={COLORS[idx % COLORS.length]}
              strokeWidth={compact ? 0.8 : 1.5} opacity="0.8" />
          )
        })}

        {/* Dots — full mode only */}
        {!compact && evaluations.map((ev, idx) =>
          keys.map((key, ki) => {
            const val = (ev[key] as number) ?? 5
            const [x, y] = getPoint(ki, val)
            return (
              <circle key={`${idx}-${ki}`} cx={x} cy={y} r="3"
                fill={COLORS[idx % COLORS.length]} stroke="white" strokeWidth="1" />
            )
          })
        )}
      </svg>

      {/* Legend — full mode only */}
      {!compact && (
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {evaluations.map((ev, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
              <span className="text-xs text-warm-700">{ev.user.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span style={{ borderTop: '3px solid #0a0a0a', width: 14, display: 'inline-block' }} />
            <span className="text-xs font-semibold text-dark">Среднее</span>
          </div>
        </div>
      )}
    </div>
  )
}
