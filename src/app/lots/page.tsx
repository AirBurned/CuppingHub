'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import ImageCropper from '@/components/ImageCropper'
import { processingLabels, roastLevelLabels, isAdmin } from '@/lib/constants'

interface Lot {
  id: string; name: string; country: string; roaster: string; processing: string; roastLevel: string
  descriptors: string | null; photoUrl: string | null; status: string; avgScore: number | null
  evaluationsCount: number; recipesCount: number
}

export default function LotsPage() {
  const [lots, setLots] = useState<Lot[]>([])
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ role: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', country: '', roaster: '', farm: '', variety: '', processing: 'WASHED', roastLevel: 'LIGHT', roastDate: '', descriptors: '' })
  const [formError, setFormError] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.ok ? r.json() : null).then(setUser)
  }, [])

  useEffect(() => {
    setLoading(true)
    const status = showArchived ? 'ARCHIVED' : 'ACTIVE'
    const timer = setTimeout(() => {
      fetch(`/api/lots?status=${status}&search=${encodeURIComponent(search)}`)
        .then((res) => res.ok ? res.json() : [])
        .then((data) => { setLots(Array.isArray(data) ? data : []); setLoading(false) })
        .catch(() => setLoading(false))
    }, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [search, showArchived])

  const userIsAdmin = user && isAdmin(user.role)

  const [cropFile, setCropFile] = useState<File | null>(null)

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCropFile(file)
  }

  async function handleCropped(blob: Blob) {
    setUploading(true)
    setCropFile(null)
    const formData = new FormData()
    formData.append('file', new File([blob], 'photo.jpg', { type: 'image/jpeg' }))
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (res.ok) { const { url } = await res.json(); setPhotoUrl(url) }
    setUploading(false)
  }

  async function handleCreateLot(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const res = await fetch('/api/lots', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, photoUrl: photoUrl || undefined }),
    })
    if (res.ok) {
      const newLot = await res.json()
      setLots((prev) => [{ ...newLot, avgScore: null, evaluationsCount: 0, recipesCount: 0 }, ...prev])
      setShowForm(false); setForm({ name: '', country: '', roaster: '', farm: '', variety: '', processing: 'WASHED', roastLevel: 'LIGHT', roastDate: '', descriptors: '' }); setPhotoUrl('')
    } else { const d = await res.json(); setFormError(d.error || 'Ошибка создания') }
  }

  async function handleArchive(lotId: string) {
    if (!confirm('Переместить лот в архив?')) return
    const res = await fetch(`/api/lots/${lotId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'ARCHIVED' }) })
    if (res.ok) setLots((p) => p.filter((l) => l.id !== lotId))
  }

  async function handleRestore(lotId: string) {
    const res = await fetch(`/api/lots/${lotId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'ACTIVE' }) })
    if (res.ok) setLots((p) => p.filter((l) => l.id !== lotId))
  }

  return (
    <div className="min-h-screen bg-light">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold">{showArchived ? 'Архив лотов' : 'Активные лоты'}</h1>
          <div className="flex items-center gap-3">
            {userIsAdmin && !showArchived && (
              <button onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-dark font-medium rounded-lg text-sm transition-colors">
                {showForm ? 'Отмена' : '+ Новый лот'}
              </button>
            )}
            <button onClick={() => setShowArchived(!showArchived)} className="text-sm text-warm-500 hover:text-dark transition-colors">
              {showArchived ? '← Активные' : 'Архив →'}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-warm-200 p-5 mb-6">
            {formError && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-3">{formError}</div>}
            <form onSubmit={handleCreateLot} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-warm-500 mb-1">Название *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" required /></div>
                <div><label className="block text-xs text-warm-500 mb-1">Страна и регион *</label><input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" required /></div>
                <div><label className="block text-xs text-warm-500 mb-1">Обжарщик *</label><input type="text" value={form.roaster} onChange={(e) => setForm({ ...form, roaster: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" required /></div>
                <div><label className="block text-xs text-warm-500 mb-1">Ферма</label><input type="text" value={form.farm} onChange={(e) => setForm({ ...form, farm: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div><label className="block text-xs text-warm-500 mb-1">Разновидность</label><input type="text" value={form.variety} onChange={(e) => setForm({ ...form, variety: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div><label className="block text-xs text-warm-500 mb-1">Обработка *</label><select value={form.processing} onChange={(e) => setForm({ ...form, processing: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">{Object.entries(processingLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                <div><label className="block text-xs text-warm-500 mb-1">Обжарка *</label><select value={form.roastLevel} onChange={(e) => setForm({ ...form, roastLevel: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">{Object.entries(roastLevelLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                <div><label className="block text-xs text-warm-500 mb-1">Дата обжарки</label><input type="date" value={form.roastDate} onChange={(e) => setForm({ ...form, roastDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
              </div>
              <div><label className="block text-xs text-warm-500 mb-1">Дескрипторы вкуса</label><input type="text" value={form.descriptors} onChange={(e) => setForm({ ...form, descriptors: e.target.value })} placeholder="Цитрус, шоколад, ягоды..." className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
              <div>
                <label className="block text-xs text-warm-500 mb-1">Фото упаковки</label>
                {cropFile ? (
                  <ImageCropper file={cropFile} onCrop={handleCropped} onCancel={() => setCropFile(null)} />
                ) : (
                  <>
                    <input type="file" accept="image/*" onChange={handlePhotoSelect}
                      className="w-full text-sm text-warm-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/15 file:text-dark hover:file:bg-primary/25" />
                    {uploading && <p className="text-xs text-warm-500 mt-1">Загрузка...</p>}
                    {photoUrl && <img src={photoUrl} alt="Preview" className="mt-2 h-24 rounded-lg object-cover" />}
                  </>
                )}
              </div>
              <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-dark text-dark font-medium rounded-lg text-sm transition-colors">Создать лот</button>
            </form>
          </div>
        )}

        <div className="mb-6">
          <input type="text" placeholder="Поиск по названию, стране, обжарщику..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors" />
        </div>

        {loading ? (
          <div className="text-center text-warm-500 py-12">Загрузка...</div>
        ) : lots.length === 0 ? (
          <div className="text-center text-warm-500 py-12">{search ? 'Ничего не найдено' : 'Лотов пока нет'}</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lots.map((lot) => (
              <div key={lot.id} className="bg-white rounded-xl border border-warm-200 overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all group flex flex-col">
                <Link href={`/lots/${lot.id}`} className="flex-1">
                  {lot.photoUrl && (
                    <div className="h-40 overflow-hidden">
                      <img src={lot.photoUrl} alt={lot.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-display text-lg font-semibold text-dark group-hover:text-primary-dark transition-colors leading-tight">{lot.name}</h3>
                      {lot.avgScore && <span className="shrink-0 ml-2 bg-primary/15 text-dark text-sm font-bold px-2 py-0.5 rounded-lg">{lot.avgScore.toFixed(2)}</span>}
                    </div>
                    <p className="text-sm text-warm-700 mb-1">{lot.country}</p>
                    <p className="text-sm text-warm-500 mb-3">{lot.roaster}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="text-xs bg-warm-100 text-warm-700 px-2 py-0.5 rounded-full">{processingLabels[lot.processing] || lot.processing}</span>
                      <span className="text-xs bg-warm-100 text-warm-700 px-2 py-0.5 rounded-full">{roastLevelLabels[lot.roastLevel] || lot.roastLevel}</span>
                    </div>
                    {lot.descriptors && <p className="text-xs text-secondary italic mb-3">{lot.descriptors}</p>}
                    <div className="flex gap-3 text-xs text-warm-500">
                      <span>{lot.evaluationsCount} оценок</span>
                      <span>{lot.recipesCount} рецептов</span>
                    </div>
                  </div>
                </Link>

                {/* Admin actions — always at bottom */}
                {userIsAdmin && (
                  <div className="flex border-t border-warm-200 mt-auto">
                    <Link href={`/lots/${lot.id}/edit`}
                      className="flex-1 text-center py-2.5 text-xs font-medium text-warm-500 hover:text-dark hover:bg-warm-50 transition-colors">
                      Редактировать
                    </Link>
                    {lot.status === 'ACTIVE' ? (
                      <button onClick={() => handleArchive(lot.id)}
                        className="flex-1 text-center py-2.5 text-xs font-medium text-warm-500 hover:text-dark hover:bg-warm-50 transition-colors border-l border-warm-200">
                        В архив
                      </button>
                    ) : (
                      <button onClick={() => handleRestore(lot.id)}
                        className="flex-1 text-center py-2.5 text-xs font-medium text-green-600 hover:bg-green-50 transition-colors border-l border-warm-200">
                        Восстановить
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
