'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import SpiderGraph from '@/components/SpiderGraph'
import { spiderKeys, spiderLabels } from '@/lib/constants'

interface EvalData {
  userId: string
  user: { name: string; username: string }
  aromaGround: number | null; aromaBrewed: number | null
  flavor: number | null; aftertaste: number | null; acidity: number | null
  body: number | null; sweetness: number | null; cleanCup: number | null; overall: number | null
  totalScore: number | null; descriptors: string | null; comment: string | null
  defectScore: number | null; defectComment: string | null
  aromaGroundComment: string | null; aromaBrewedComment: string | null
  [key: string]: unknown
}

export default function ScoresPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [evaluations, setEvaluations] = useState<EvalData[]>([])
  const [locked, setLocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userIsAdmin, setUserIsAdmin] = useState(false)
  const [hiddenUsers, setHiddenUsers] = useState<Set<string>>(new Set())

  function loadScores() {
    fetch(`/api/lots/${id}/scores`)
      .then((r) => r.json())
      .then((data) => {
        if (data.locked) setLocked(true)
        else setEvaluations(data.evaluations || [])
        if (data.isAdmin) setUserIsAdmin(true)
        setLoading(false)
      })
  }

  useEffect(() => { loadScores() }, [id])

  async function handleDeleteEvaluation(userId: string, userName: string) {
    if (!confirm(`Удалить оценку участника "${userName}"? Это действие нельзя отменить.`)) return
    const res = await fetch(`/api/lots/${id}/evaluate`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (res.ok) loadScores()
  }

  function toggleHideUser(userId: string) {
    setHiddenUsers((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId); else next.add(userId)
      return next
    })
  }

  const visibleEvaluations = evaluations.filter((e) => !hiddenUsers.has(e.userId))

  if (loading) return <div className="min-h-screen bg-light"><Header /><div className="text-center text-warm-500 py-12">Загрузка...</div></div>

  if (locked) return (
    <div className="min-h-screen bg-light"><Header />
      <main className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-warm-500 mb-4">Сначала отправьте свою оценку, чтобы увидеть результаты команды.</p>
        <button onClick={() => router.push(`/lots/${id}/evaluate`)} className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-dark font-semibold rounded-lg transition-colors">Оценить</button>
      </main>
    </div>
  )

  const filledKeys = spiderKeys.filter((k) => visibleEvaluations.some((e) => (e[k] as number | null) !== null))

  const averages: Record<string, number> = {}
  for (const key of filledKeys) {
    const vals = visibleEvaluations.map((e) => e[key] as number).filter((v) => v !== null && v !== undefined)
    averages[key] = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0
  }

  return (
    <div className="min-h-screen bg-light">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <button onClick={() => router.back()} className="text-sm text-warm-500 hover:text-dark mb-4 transition-colors">← Назад</button>

        {/* Admin: manage evaluations */}
        {userIsAdmin && evaluations.length > 0 && (
          <div className="bg-white rounded-xl border border-warm-200 p-4 mb-6">
            <h2 className="text-sm font-semibold mb-3">Управление оценками</h2>
            <div className="flex flex-wrap gap-2">
              {evaluations.map((e) => {
                const isHidden = hiddenUsers.has(e.userId)
                return (
                  <div key={e.userId} className="flex items-center gap-1.5 border border-warm-200 rounded-lg px-3 py-1.5">
                    <span className={`text-sm ${isHidden ? 'line-through text-warm-400' : ''}`}>{e.user.name}</span>
                    <button onClick={() => toggleHideUser(e.userId)} title={isHidden ? 'Показать' : 'Скрыть'}
                      className={`text-xs px-1.5 py-0.5 rounded transition-colors ${isHidden ? 'text-primary hover:bg-primary/10' : 'text-warm-400 hover:bg-warm-100'}`}>
                      {isHidden ? '👁' : '👁‍🗨'}
                    </button>
                    <button onClick={() => handleDeleteEvaluation(e.userId, e.user.name)} title="Удалить оценку"
                      className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors">
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
            {hiddenUsers.size > 0 && (
              <p className="text-xs text-warm-500 mt-2">Скрыто: {hiddenUsers.size}. Скрытые оценки не учитываются в графике и средних.</p>
            )}
          </div>
        )}

        {/* Spider graph */}
        <div className="bg-white rounded-xl border border-warm-200 p-6 mb-6">
          <h1 className="font-display text-xl font-bold mb-6">Сравнение оценок команды</h1>
          <SpiderGraph evaluations={visibleEvaluations} />
        </div>

        {/* Scores table */}
        <div className="bg-white rounded-xl border border-warm-200 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-warm-200 bg-warm-100/50">
                  <th className="text-left px-4 py-3 font-medium text-warm-700 sticky left-0 bg-warm-100/50">Критерий</th>
                  {visibleEvaluations.map((e, i) => (
                    <th key={i} className="text-center px-3 py-3 font-medium text-warm-700 min-w-[80px]">{e.user.name}</th>
                  ))}
                  <th className="text-center px-3 py-3 font-medium text-warm-900 min-w-[80px]">Среднее</th>
                </tr>
              </thead>
              <tbody>
                {filledKeys.map((key) => (
                  <tr key={key} className="border-b border-warm-100">
                    <td className="px-4 py-2.5 font-medium text-warm-700 sticky left-0 bg-white">{spiderLabels[key]}</td>
                    {visibleEvaluations.map((e, i) => {
                      const val = e[key] as number | null
                      const avg = averages[key]
                      const diff = val !== null ? val - avg : 0
                      const color = Math.abs(diff) < 0.5 ? '' : diff > 0 ? 'text-green-600' : 'text-red-500'
                      return <td key={i} className={`text-center px-3 py-2.5 tabular-nums ${color}`}>{val !== null ? val.toFixed(2) : '—'}</td>
                    })}
                    <td className="text-center px-3 py-2.5 font-bold tabular-nums text-primary-dark">{averages[key].toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-warm-300 bg-warm-50">
                  <td className="px-4 py-3 font-bold sticky left-0 bg-warm-50">Итого</td>
                  {visibleEvaluations.map((e, i) => (
                    <td key={i} className="text-center px-3 py-3 font-bold tabular-nums text-lg">{e.totalScore?.toFixed(2) ?? '—'}</td>
                  ))}
                  <td className="text-center px-3 py-3 font-bold tabular-nums text-lg text-primary-dark">
                    {visibleEvaluations.length > 0 ? (visibleEvaluations.reduce((s, e) => s + (e.totalScore ?? 0), 0) / visibleEvaluations.length).toFixed(2) : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Defects */}
        {visibleEvaluations.some((e) => e.defectScore !== null) && (
          <div className="bg-white rounded-xl border border-warm-200 p-6 mb-6">
            <h2 className="font-display text-lg font-semibold mb-4">Дефекты (отдельно от общей оценки)</h2>
            <div className="space-y-3">
              {visibleEvaluations.filter((e) => e.defectScore !== null).map((e, i) => (
                <div key={i} className="flex items-start justify-between border-b border-warm-100 pb-3 last:border-0">
                  <div>
                    <span className="font-medium text-sm">{e.user.name}</span>
                    {e.defectComment && <p className="text-xs text-warm-500 mt-1">{e.defectComment}</p>}
                  </div>
                  <span className={`text-lg font-bold ${(e.defectScore ?? 10) < 5 ? 'text-red-500' : 'text-green-600'}`}>
                    {e.defectScore?.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {visibleEvaluations.some((e) => e.descriptors || e.comment || e.aromaGroundComment || e.aromaBrewedComment) && (
          <div className="bg-white rounded-xl border border-warm-200 p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Заметки команды</h2>
            <div className="space-y-3">
              {visibleEvaluations.filter((e) => e.descriptors || e.comment || e.aromaGroundComment || e.aromaBrewedComment).map((e, i) => (
                <div key={i} className="border-b border-warm-100 pb-3 last:border-0">
                  <span className="text-sm font-medium">{e.user.name}</span>
                  {e.aromaGroundComment && <p className="text-xs text-warm-500 mt-1">Аромат (молотый): {e.aromaGroundComment}</p>}
                  {e.aromaBrewedComment && <p className="text-xs text-warm-500 mt-1">Аромат (заваренный): {e.aromaBrewedComment}</p>}
                  {e.descriptors && <p className="text-sm text-secondary italic mt-1">{e.descriptors}</p>}
                  {e.comment && <p className="text-sm text-warm-700 mt-1">{e.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
