'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import TouchSlider from '@/components/TouchSlider'
import { stage1Keys, stage1Labels, stage2Keys, stage2Labels, stage3Keys, stage3Labels, spiderKeys, scaleDescriptions } from '@/lib/constants'

type Scores = Record<string, number | null>

const stages = [
  { title: 'Аромат смолотого зерна', subtitle: 'Оцените аромат сухого помола', keys: stage1Keys, labels: stage1Labels, commentKey: 'aromaGroundComment', commentPlaceholder: 'Чем пахнет? Цветочный, ореховый, фруктовый...' },
  { title: 'Аромат заваренного зерна', subtitle: 'Оцените аромат после заваривания', keys: stage2Keys, labels: stage2Labels, commentKey: 'aromaBrewedComment', commentPlaceholder: 'Как изменился аромат? Шоколадный, карамельный, специи...' },
  { title: 'Вкус', subtitle: 'Оцените вкусовые характеристики', keys: stage3Keys, labels: stage3Labels, commentKey: null, commentPlaceholder: '', hasDescriptors: true },
  { title: 'Дефекты', subtitle: 'Оцените качество зерна', keys: [] as readonly string[], labels: {} as Record<string, string>, commentKey: null, commentPlaceholder: '', isDefects: true },
]

export default function EvaluatePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const cuppingId = searchParams.get('cupping')
  const lotIndex = parseInt(searchParams.get('lotIndex') || '0')
  const totalLots = parseInt(searchParams.get('totalLots') || '0')

  const allInputKeys = [...stage1Keys, ...stage2Keys, ...stage3Keys] as const
  const [scores, setScores] = useState<Scores>(Object.fromEntries(allInputKeys.map((k) => [k, 5])))
  const [aromaGroundComment, setAromaGroundComment] = useState('')
  const [aromaBrewedComment, setAromaBrewedComment] = useState('')
  const [descriptors, setDescriptors] = useState('')
  const [comment, setComment] = useState('')
  const [defectScore, setDefectScore] = useState<number | null>(5)
  const [defectComment, setDefectComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [error, setError] = useState('')
  const [currentStage, setCurrentStage] = useState(0)

  // Cupping lots for swipe navigation
  const [cuppingLots, setCuppingLots] = useState<{ id: string; name: string; photoUrl?: string | null }[]>([])
  const [lotPhoto, setLotPhoto] = useState<string | null>(null)
  const [lotName, setLotName] = useState<string>('')

  useEffect(() => {
    // Load lot details (name, photo)
    fetch(`/api/lots/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.photoUrl) setLotPhoto(data.photoUrl)
        if (data.name) setLotName(data.name)
      })

    fetch(`/api/lots/${id}/evaluate`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.id) {
          setIsEdit(true)
          const loaded: Scores = {}
          for (const key of allInputKeys) { loaded[key] = data[key] ?? 5 }
          setScores(loaded)
          setAromaGroundComment(data.aromaGroundComment || '')
          setAromaBrewedComment(data.aromaBrewedComment || '')
          setDescriptors(data.descriptors || '')
          setComment(data.comment || '')
          setDefectScore(data.defectScore ?? 5)
          setDefectComment(data.defectComment || '')
        }
        setLoading(false)
      })

    // Load cupping lots if inside a cupping
    if (cuppingId) {
      fetch(`/api/cuppings/${cuppingId}`).then((r) => r.json()).then((data) => {
        if (data.lots) setCuppingLots(data.lots.map((l: { id: string; name: string }) => ({ id: l.id, name: l.name })))
      })
    }
  }, [id, cuppingId])

  function handleScore(key: string, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }))
  }

  const filledScores = Object.entries(scores).filter(([, v]) => v !== null)
  const totalScore = filledScores.length > 0 ? filledScores.reduce((sum, [, v]) => sum + (v as number), 0) / filledScores.length : 0

  async function handleSaveStage() {
    setSaving(true)
    setError('')
    try {
      const stageData: Record<string, unknown> = {}
      const stage = stages[currentStage]

      if (stage.isDefects) {
        if (defectScore !== null) stageData.defectScore = defectScore
        stageData.defectComment = defectComment
      } else {
        for (const key of stage.keys) {
          if (scores[key] !== null) stageData[key] = scores[key]
        }
        if (stage.commentKey === 'aromaGroundComment') stageData.aromaGroundComment = aromaGroundComment
        if (stage.commentKey === 'aromaBrewedComment') stageData.aromaBrewedComment = aromaBrewedComment
        if (stage.hasDescriptors) stageData.descriptors = descriptors
      }

      const res = await fetch(`/api/lots/${id}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stageData),
      })
      if (res.ok) {
        setIsEdit(true)
        setCurrentStage(currentStage + 1)
      } else {
        const data = await res.json()
        setError(data.error || 'Ошибка сохранения')
      }
    } catch {
      setError('Ошибка соединения')
    }
    setSaving(false)
  }

  async function handleSubmit() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/lots/${id}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...scores, aromaGroundComment, aromaBrewedComment, descriptors, comment, defectScore, defectComment }),
      })
      if (res.ok) {
        if (cuppingId) { router.push(`/cuppings/${cuppingId}`) } else { router.push(`/lots/${id}`) }
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Ошибка сохранения')
      }
    } catch {
      setError('Ошибка соединения')
    }
    setSaving(false)
  }

  // Swipe to prev/next lot in cupping
  function navigateToLot(direction: -1 | 1) {
    if (!cuppingLots.length) return
    const currentIdx = cuppingLots.findIndex((l) => l.id === id)
    const nextIdx = currentIdx + direction
    if (nextIdx < 0 || nextIdx >= cuppingLots.length) return
    const nextLot = cuppingLots[nextIdx]
    router.push(`/lots/${nextLot.id}/evaluate?cupping=${cuppingId}&lotIndex=${nextIdx}&totalLots=${cuppingLots.length}`)
  }

  // Touch swipe detection
  const [touchStart, setTouchStart] = useState<number | null>(null)
  function handleTouchStart(e: React.TouchEvent) {
    setTouchStart(e.touches[0].clientX)
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart === null) return
    const diff = e.changedTouches[0].clientX - touchStart
    if (Math.abs(diff) > 80) {
      navigateToLot(diff > 0 ? -1 : 1)
    }
    setTouchStart(null)
  }

  if (loading) return <div className="min-h-screen bg-light"><Header /><div className="text-center text-warm-500 py-12">Загрузка...</div></div>

  const isFinalStage = currentStage === stages.length

  function SliderField({ label, value, onChange, min = 1, max = 10, step = 0.5, color = 'text-primary', scaleKey }: { label: string; value: number | null; onChange: (v: number) => void; min?: number; max?: number; step?: number; color?: string; scaleKey?: string }) {
    const desc = scaleKey ? scaleDescriptions[scaleKey] : undefined
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium">{label}</label>
          <span className={`text-sm font-bold ${color} tabular-nums w-12 text-right`}>{(value ?? 5).toFixed(1)}</span>
        </div>
        {desc && (
          <div className="flex justify-between text-[10px] text-warm-400 mb-1">
            <span>{desc.low}</span>
            <span>{desc.high}</span>
          </div>
        )}
        <TouchSlider value={value ?? 5} onChange={onChange} min={min} max={max} step={step} />
        <div className="flex justify-between text-[10px] text-warm-400 mt-0.5 px-0.5 tabular-nums">
          {Array.from({ length: max - min + 1 }, (_, i) => <span key={i}>{min + i}</span>)}
        </div>
      </div>
    )
  }

  const currentLotName = cuppingLots.find((l) => l.id === id)?.name
  const canGoPrev = cuppingLots.length > 0 && cuppingLots.findIndex((l) => l.id === id) > 0
  const canGoNext = cuppingLots.length > 0 && cuppingLots.findIndex((l) => l.id === id) < cuppingLots.length - 1

  return (
    <div className="min-h-screen bg-light" onTouchStart={cuppingId ? handleTouchStart : undefined} onTouchEnd={cuppingId ? handleTouchEnd : undefined}>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <button onClick={() => router.back()} className="text-sm text-warm-500 hover:text-dark mb-4 transition-colors">← Назад</button>

        {/* Lot photo — same crop as lot detail card */}
        {lotPhoto && (
          <div className="mb-4 rounded-xl overflow-hidden border border-warm-200 h-48 sm:h-64">
            <img src={lotPhoto} alt={lotName} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Lot navigation in cupping */}
        {cuppingId && cuppingLots.length > 0 && (
          <div className="flex items-center justify-between mb-4 bg-white rounded-lg border border-warm-200 px-4 py-2">
            <button onClick={() => navigateToLot(-1)} disabled={!canGoPrev}
              className={`text-sm font-medium ${canGoPrev ? 'text-primary hover:text-primary-dark' : 'text-warm-300'}`}>
              ← Пред. лот
            </button>
            <span className="text-sm font-semibold text-dark">{currentLotName || lotName || 'Лот'}</span>
            <button onClick={() => navigateToLot(1)} disabled={!canGoNext}
              className={`text-sm font-medium ${canGoNext ? 'text-primary hover:text-primary-dark' : 'text-warm-300'}`}>
              След. лот →
            </button>
          </div>
        )}

        {/* Lot name (only when NOT inside a cupping, since cupping has the switcher) */}
        {!cuppingId && lotName && (
          <h2 className="font-display text-lg font-bold mb-4">{lotName}</h2>
        )}

        {/* Stage tabs */}
        <div className="flex gap-0.5 mb-6 bg-warm-100 p-1 rounded-lg overflow-x-auto">
          {stages.map((s, i) => (
            <button key={i} onClick={() => setCurrentStage(i)}
              className={`flex-1 px-2 py-2 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${currentStage === i ? 'bg-white text-dark shadow-sm' : 'text-warm-500 hover:text-dark'}`}>
              {i + 1}. {s.title}
            </button>
          ))}
          <button onClick={() => setCurrentStage(stages.length)}
            className={`flex-1 px-2 py-2 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${isFinalStage ? 'bg-white text-dark shadow-sm' : 'text-warm-500 hover:text-dark'}`}>
            5. Итог
          </button>
        </div>

        <div className="bg-white rounded-xl border border-warm-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-display text-xl font-bold">
              {isFinalStage ? 'Итог' : `${currentStage + 1}. ${stages[currentStage].title}`}
            </h1>
            <div className="text-right">
              <span className="text-xs text-warm-500">Среднее</span>
              <p className="text-2xl font-bold text-primary">{totalScore.toFixed(1)}</p>
            </div>
          </div>
          {!isFinalStage && stages[currentStage].subtitle && <p className="text-sm text-warm-500 mb-6">{stages[currentStage].subtitle}</p>}

          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">{error}</div>}

          {!isFinalStage && !stages[currentStage].isDefects ? (
            <div className="space-y-6">
              {stages[currentStage].keys.map((key) => (
                <SliderField key={key} label={stages[currentStage].labels[key]} value={scores[key]} onChange={(v) => handleScore(key, v)} scaleKey={key} />
              ))}

              {stages[currentStage].commentKey && (
                <div>
                  <label className="block text-sm font-medium mb-1">Комментарий к аромату</label>
                  <textarea
                    value={stages[currentStage].commentKey === 'aromaGroundComment' ? aromaGroundComment : aromaBrewedComment}
                    onChange={(e) => {
                      if (stages[currentStage].commentKey === 'aromaGroundComment') setAromaGroundComment(e.target.value)
                      else setAromaBrewedComment(e.target.value)
                    }}
                    placeholder={stages[currentStage].commentPlaceholder} rows={2}
                    className="w-full px-4 py-2.5 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                </div>
              )}

              {stages[currentStage].hasDescriptors && (
                <div>
                  <label className="block text-sm font-medium mb-1">Дескрипторы вкуса</label>
                  <input type="text" value={descriptors} onChange={(e) => setDescriptors(e.target.value)}
                    placeholder="Цитрус, карамель, ягоды..."
                    className="w-full px-4 py-2.5 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              )}

              <button onClick={handleSaveStage} disabled={saving}
                className="w-full py-3 bg-primary hover:bg-primary-dark disabled:opacity-50 text-dark font-semibold rounded-lg transition-colors">
                {saving ? 'Сохранение...' : 'Сохранить и далее →'}
              </button>
            </div>
          ) : !isFinalStage && stages[currentStage].isDefects ? (
            <div className="space-y-6">
              <SliderField label="Дефекты" value={defectScore} onChange={(v) => setDefectScore(v)} step={0.5} color="text-red-500" scaleKey={undefined} />
              <p className="text-xs text-warm-500 -mt-4">1 = много дефектов, 10 = нет дефектов</p>
              <div>
                <label className="block text-sm font-medium mb-1">Комментарий к дефектам</label>
                <textarea value={defectComment} onChange={(e) => setDefectComment(e.target.value)}
                  placeholder="Шелуха, трещины, неравномерная обжарка..."
                  rows={2} className="w-full px-4 py-2.5 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              </div>
              <button onClick={handleSaveStage} disabled={saving}
                className="w-full py-3 bg-primary hover:bg-primary-dark disabled:opacity-50 text-dark font-semibold rounded-lg transition-colors">
                {saving ? 'Сохранение...' : 'Сохранить и далее →'}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-sm text-warm-500">Проверьте оценки и отправьте результат.</p>
              <div>
                <label className="block text-sm font-medium mb-1">Общий комментарий</label>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Заметки к оценке..." rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              </div>
              <button onClick={handleSubmit} disabled={saving}
                className="w-full py-3 bg-primary hover:bg-primary-dark disabled:opacity-50 text-dark font-semibold rounded-lg transition-colors">
                {saving ? 'Сохранение...' : isEdit ? 'Обновить оценку' : 'Отправить оценку'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
