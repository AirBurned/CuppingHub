'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { isAdmin } from '@/lib/constants'

interface CuppingSession {
  id: string
  name: string
  date: string
  notes: string | null
  status: string
  createdBy: string
  lotsCount: number
}

export default function CuppingsPage() {
  const [sessions, setSessions] = useState<CuppingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ role: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', date: '', notes: '' })
  const [lots, setLots] = useState<{ id: string; name: string }[]>([])
  const [selectedLots, setSelectedLots] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch('/api/cuppings').then((r) => r.json()).then((data) => { setSessions(data); setLoading(false) })
    fetch('/api/auth/me').then((r) => r.ok ? r.json() : null).then(setUser)
  }, [])

  function openForm() {
    if (showForm) {
      setShowForm(false)
      return
    }
    setShowForm(true)
    fetch('/api/lots?status=ACTIVE').then((r) => r.json()).then(setLots)
  }

  function toggleLot(lotId: string) {
    setSelectedLots((prev) => prev.includes(lotId) ? prev.filter((id) => id !== lotId) : [...prev, lotId])
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (creating) return
    setCreating(true)
    const res = await fetch('/api/cuppings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, lotIds: selectedLots }),
    })
    if (res.ok) {
      const created = await res.json()
      setSessions((prev) => [{ ...created, lotsCount: selectedLots.length, createdBy: 'Вы', status: 'PLANNED' }, ...prev])
      setShowForm(false)
      setForm({ name: '', date: '', notes: '' })
      setSelectedLots([])
    }
    setCreating(false)
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const planned = sessions.filter((s) => s.status === 'PLANNED')
  const completed = sessions.filter((s) => s.status === 'COMPLETED')

  return (
    <div className="min-h-screen bg-light">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold">Каппинги</h1>
          {user && isAdmin(user.role) && (
            <button onClick={openForm} className="px-4 py-2 bg-primary hover:bg-primary-dark text-dark font-medium rounded-lg text-sm transition-colors">
              {showForm ? 'Отмена' : '+ Новый каппинг'}
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl border border-warm-200 p-5 mb-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-warm-500 mb-1">Название *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Каппинг новых лотов" className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" required />
              </div>
              <div>
                <label className="block text-xs text-warm-500 mb-1">Дата *</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" required />
              </div>
            </div>
            <div>
              <label className="block text-xs text-warm-500 mb-1">Заметки</label>
              <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Описание каппинга..." className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="block text-xs text-warm-500 mb-2">Лоты для каппинга</label>
              <div className="flex flex-wrap gap-2">
                {lots.map((lot) => (
                  <button key={lot.id} type="button" onClick={() => toggleLot(lot.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      selectedLots.includes(lot.id)
                        ? 'border-primary bg-primary/15 text-dark font-medium'
                        : 'border-warm-200 text-warm-700 hover:border-warm-300'
                    }`}>
                    {lot.name}
                  </button>
                ))}
                {lots.length === 0 && <p className="text-xs text-warm-500">Загрузка лотов...</p>}
              </div>
              {selectedLots.length > 0 && <p className="text-xs text-warm-500 mt-1">Выбрано: {selectedLots.length}</p>}
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={creating}
                className="px-4 py-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-dark font-medium rounded-lg text-sm transition-colors">
                {creating ? 'Создание...' : 'Создать каппинг'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-warm-100 text-warm-700 hover:bg-warm-200 rounded-lg text-sm transition-colors">
                Отмена
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center text-warm-500 py-12">Загрузка...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center text-warm-500 py-12">Каппингов пока нет</div>
        ) : (
          <div className="space-y-6">
            {planned.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-warm-500 uppercase tracking-wider mb-3">Запланированные</h2>
                <div className="space-y-3">
                  {planned.map((s) => (
                    <Link key={s.id} href={`/cuppings/${s.id}`}
                      className="block bg-white rounded-xl border border-primary/30 p-5 hover:border-primary/60 hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-display text-lg font-semibold">{s.name}</h3>
                        <span className="text-xs bg-primary/15 text-dark px-2 py-0.5 rounded-full font-medium">{formatDate(s.date)}</span>
                      </div>
                      {s.notes && <p className="text-sm text-warm-500 mb-2">{s.notes}</p>}
                      <div className="flex gap-3 text-xs text-warm-500">
                        <span>{s.lotsCount} лотов</span>
                        <span>Создал: {s.createdBy}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {completed.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-warm-500 uppercase tracking-wider mb-3">Проведённые</h2>
                <div className="space-y-3">
                  {completed.map((s) => (
                    <Link key={s.id} href={`/cuppings/${s.id}`}
                      className="block bg-white rounded-xl border border-warm-200 p-5 hover:border-warm-300 hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-lg font-semibold text-warm-700">{s.name}</h3>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Проведён</span>
                        </div>
                        <span className="text-xs bg-warm-100 text-warm-700 px-2 py-0.5 rounded-full">{formatDate(s.date)}</span>
                      </div>
                      {s.notes && <p className="text-sm text-warm-500 mb-2">{s.notes}</p>}
                      <div className="flex gap-3 text-xs text-warm-500">
                        <span>{s.lotsCount} лотов</span>
                        <span>Создал: {s.createdBy}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
