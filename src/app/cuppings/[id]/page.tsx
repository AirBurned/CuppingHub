'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { processingLabels, roastLevelLabels, isAdmin } from '@/lib/constants'

interface LotInSession {
  id: string; sessionLotId: string; name: string; country: string; roaster: string; processing: string
  photoUrl: string | null; hasEvaluated: boolean; evaluationsCount: number; avgScore: number | null
  officialRecipe: { brewMethod: string; dose: number | null; yield: number | null; ratio: string | null } | null
}

interface CuppingDetail {
  id: string; name: string; date: string; notes: string | null; status: string; createdBy: string; createdById: string; lots: LotInSession[]
}

interface AvailableLot { id: string; name: string; country: string; roaster: string }

export default function CuppingSessionPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [session, setSession] = useState<CuppingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ userId: string; role: string } | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', date: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [showAddLot, setShowAddLot] = useState(false)
  const [availableLots, setAvailableLots] = useState<AvailableLot[]>([])
  const [showNewLotForm, setShowNewLotForm] = useState(false)
  const [newLot, setNewLot] = useState({ name: '', country: '', roaster: '', farm: '', variety: '', processing: 'WASHED', roastLevel: 'LIGHT', roastDate: '', descriptors: '' })
  const [creatingLot, setCreatingLot] = useState(false)

  function loadSession() {
    fetch(`/api/cuppings/${id}`).then((r) => r.json()).then((data) => { setSession(data); setLoading(false) })
  }

  useEffect(() => {
    loadSession()
    fetch('/api/auth/me').then((r) => r.ok ? r.json() : null).then(setUser)
    const handleFocus = () => loadSession()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [id])

  const userIsAdmin = user && isAdmin(user.role)

  function startEdit() {
    if (!session) return
    setEditForm({
      name: session.name,
      date: session.date.split('T')[0],
      notes: session.notes || '',
    })
    setEditing(true)
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/cuppings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    if (res.ok) {
      setEditing(false)
      loadSession()
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Удалить каппинг? Это действие нельзя отменить.')) return
    const res = await fetch(`/api/cuppings/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/cuppings')
  }

  function openAddLot() {
    setShowAddLot(true)
    fetch('/api/lots?status=ACTIVE').then((r) => r.json()).then(setAvailableLots)
  }

  async function handleAddLot(lotId: string) {
    const res = await fetch(`/api/cuppings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addLotId: lotId }),
    })
    if (res.ok) {
      setShowAddLot(false)
      loadSession()
    }
  }

  async function handleCreateAndAddLot(e: React.FormEvent) {
    e.preventDefault()
    setCreatingLot(true)
    // 1. Create the lot
    const res = await fetch('/api/lots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLot),
    })
    if (res.ok) {
      const created = await res.json()
      // 2. Add it to the cupping
      await fetch(`/api/cuppings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addLotId: created.id }),
      })
      setShowNewLotForm(false)
      setNewLot({ name: '', country: '', roaster: '', farm: '', variety: '', processing: 'WASHED', roastLevel: 'LIGHT', roastDate: '', descriptors: '' })
      loadSession()
    }
    setCreatingLot(false)
  }

  async function handleRemoveLot(lotId: string) {
    if (!confirm('Убрать лот из каппинга?')) return
    const res = await fetch(`/api/cuppings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ removeLotId: lotId }),
    })
    if (res.ok) loadSession()
  }

  async function handleToggleStatus() {
    if (!session) return
    const newStatus = session.status === 'COMPLETED' ? 'PLANNED' : 'COMPLETED'
    const res = await fetch(`/api/cuppings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) loadSession()
  }

  if (loading) return <div className="min-h-screen bg-light"><Header /><div className="text-center text-warm-500 py-12">Загрузка...</div></div>
  if (!session) return <div className="min-h-screen bg-light"><Header /><div className="text-center text-warm-500 py-12">Каппинг не найден</div></div>

  const evaluatedCount = session.lots.filter((l) => l.hasEvaluated).length
  const totalLots = session.lots.length
  const existingLotIds = new Set(session.lots.map((l) => l.id))
  const lotsToAdd = availableLots.filter((l) => !existingLotIds.has(l.id))

  return (
    <div className="min-h-screen bg-light">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <button onClick={() => router.push('/cuppings')} className="text-sm text-warm-500 hover:text-dark mb-4 transition-colors">← Все каппинги</button>

        {/* Session info / edit form */}
        <div className="bg-white rounded-xl border border-warm-200 p-6 mb-6">
          {editing ? (
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-warm-500 mb-1">Название</label>
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" required />
                </div>
                <div>
                  <label className="block text-xs text-warm-500 mb-1">Дата</label>
                  <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" required />
                </div>
              </div>
              <div>
                <label className="block text-xs text-warm-500 mb-1">Заметки</label>
                <input type="text" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary hover:bg-primary-dark text-dark font-medium rounded-lg text-sm transition-colors">
                  {saving ? '...' : 'Сохранить'}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 bg-warm-100 text-warm-700 rounded-lg text-sm">Отмена</button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="font-display text-2xl font-bold">{session.name}</h1>
                    {session.status === 'COMPLETED' && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Проведён</span>
                    )}
                  </div>
                  <p className="text-sm text-warm-500">
                    {new Date(session.date).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {' · '}{session.createdBy}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-warm-500">Прогресс</span>
                    <p className={`text-lg font-bold ${evaluatedCount === totalLots && totalLots > 0 ? 'text-green-600' : 'text-primary'}`}>
                      {evaluatedCount}/{totalLots}
                    </p>
                  </div>
                </div>
              </div>
              {session.notes && <p className="text-sm text-warm-700 mt-2">{session.notes}</p>}
              <div className="mt-4 h-2 bg-warm-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: totalLots > 0 ? `${(evaluatedCount / totalLots) * 100}%` : '0%' }} />
              </div>

              {/* Admin actions */}
              {userIsAdmin && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-warm-200">
                  <button onClick={handleToggleStatus}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      session.status === 'COMPLETED'
                        ? 'bg-warm-100 text-warm-700 hover:bg-warm-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}>
                    {session.status === 'COMPLETED' ? 'Вернуть в план' : 'Отметить как проведённый'}
                  </button>
                  <button onClick={startEdit} className="px-3 py-1.5 border border-warm-300 text-warm-700 hover:bg-warm-100 rounded-lg text-xs font-medium transition-colors">
                    Редактировать
                  </button>
                  <button onClick={openAddLot} className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-dark rounded-lg text-xs font-medium transition-colors">
                    + Добавить лот
                  </button>
                  <button onClick={handleDelete} className="px-3 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors ml-auto">
                    Удалить каппинг
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Add lot modal */}
        {showAddLot && (
          <div className="bg-white rounded-xl border border-primary/30 p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm font-semibold">Добавить лот в каппинг</h3>
              <div className="flex gap-2">
                <button onClick={() => setShowNewLotForm(!showNewLotForm)}
                  className="text-xs text-primary font-medium hover:text-primary-dark">
                  {showNewLotForm ? 'Отмена' : '+ Создать новый лот'}
                </button>
                <button onClick={() => { setShowAddLot(false); setShowNewLotForm(false) }} className="text-xs text-warm-500 hover:text-dark">Закрыть</button>
              </div>
            </div>

            {/* Form to create a new lot */}
            {showNewLotForm && (
              <form onSubmit={handleCreateAndAddLot} className="border border-warm-200 rounded-lg p-4 mb-4 space-y-3">
                <p className="text-xs text-warm-500 mb-2">Создать лот и сразу добавить в каппинг</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-warm-500 mb-1">Название *</label><input type="text" value={newLot.name} onChange={(e) => setNewLot({ ...newLot, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" required /></div>
                  <div><label className="block text-xs text-warm-500 mb-1">Страна *</label><input type="text" value={newLot.country} onChange={(e) => setNewLot({ ...newLot, country: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" required /></div>
                  <div><label className="block text-xs text-warm-500 mb-1">Обжарщик *</label><input type="text" value={newLot.roaster} onChange={(e) => setNewLot({ ...newLot, roaster: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" required /></div>
                  <div><label className="block text-xs text-warm-500 mb-1">Обработка</label><select value={newLot.processing} onChange={(e) => setNewLot({ ...newLot, processing: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">{Object.entries(processingLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                  <div><label className="block text-xs text-warm-500 mb-1">Обжарка</label><select value={newLot.roastLevel} onChange={(e) => setNewLot({ ...newLot, roastLevel: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">{Object.entries(roastLevelLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                  <div><label className="block text-xs text-warm-500 mb-1">Дата обжарки</label><input type="date" value={newLot.roastDate} onChange={(e) => setNewLot({ ...newLot, roastDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                </div>
                <button type="submit" disabled={creatingLot}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-dark font-medium rounded-lg text-sm transition-colors">
                  {creatingLot ? 'Создание...' : 'Создать и добавить'}
                </button>
              </form>
            )}

            {/* Existing lots to add */}
            {lotsToAdd.length === 0 && !showNewLotForm ? (
              <p className="text-sm text-warm-500">Все активные лоты уже добавлены</p>
            ) : lotsToAdd.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {lotsToAdd.map((lot) => (
                  <button key={lot.id} onClick={() => handleAddLot(lot.id)}
                    className="w-full text-left p-3 rounded-lg border border-warm-200 hover:border-primary/40 hover:bg-primary/5 transition-all">
                    <span className="text-sm font-medium">{lot.name}</span>
                    <span className="text-xs text-warm-500 ml-2">{lot.country} · {lot.roaster}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lots */}
        <h2 className="font-display text-lg font-semibold mb-4">Лоты для оценки ({totalLots})</h2>

        <div className="space-y-3">
          {session.lots.map((lot, index) => (
            <div key={lot.id} className={`bg-white rounded-xl border overflow-hidden transition-all ${
              lot.hasEvaluated ? 'border-green-200' : 'border-warm-200 hover:border-primary/40'
            }`}>
              <div className="flex">
                {lot.photoUrl && (
                  <div className="w-24 h-24 shrink-0">
                    <img src={lot.photoUrl} alt={lot.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <span className="text-xs text-warm-500 font-medium">#{index + 1}</span>
                      <h3 className="font-display font-semibold leading-tight">{lot.name}</h3>
                      <p className="text-xs text-warm-500">{lot.country} · {lot.roaster} · {processingLabels[lot.processing] || lot.processing}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {lot.avgScore && (
                        <span className="text-sm font-bold bg-primary/15 px-2 py-0.5 rounded-lg">{lot.avgScore.toFixed(2)}</span>
                      )}
                      {lot.hasEvaluated && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Оценён</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Link href={`/lots/${lot.id}/evaluate?cupping=${session.id}&lotIndex=${index}&totalLots=${totalLots}`}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        lot.hasEvaluated
                          ? 'bg-warm-100 text-warm-700 hover:bg-warm-200'
                          : 'bg-primary hover:bg-primary-dark text-dark'
                      }`}>
                      {lot.hasEvaluated ? 'Изменить оценку' : 'Оценить'}
                    </Link>
                    <Link href={`/lots/${lot.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-warm-100 text-warm-700 hover:bg-warm-200 transition-colors">
                      Подробнее
                    </Link>
                    {lot.hasEvaluated && (
                      <Link href={`/lots/${lot.id}/scores`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-dark text-white hover:bg-warm-900 transition-colors">
                        Сравнить
                      </Link>
                    )}
                    {userIsAdmin && (
                      <button onClick={() => handleRemoveLot(lot.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors ml-auto">
                        Убрать
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
