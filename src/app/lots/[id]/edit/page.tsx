'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import ImageCropper from '@/components/ImageCropper'
import { processingLabels, roastLevelLabels } from '@/lib/constants'

export default function EditLotPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', country: '', roaster: '', farm: '', variety: '', processing: 'WASHED', roastLevel: 'LIGHT', roastDate: '', descriptors: '' })
  const [photoUrl, setPhotoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/lots/${id}`).then((r) => r.ok ? r.json() : null).then((lot) => {
      if (lot) {
        setForm({
          name: lot.name, country: lot.country, roaster: lot.roaster,
          farm: lot.farm || '', variety: lot.variety || '',
          processing: lot.processing, roastLevel: lot.roastLevel,
          roastDate: lot.roastDate ? lot.roastDate.split('T')[0] : '',
          descriptors: lot.descriptors || '',
        })
        setPhotoUrl(lot.photoUrl || '')
      }
      setLoading(false)
    })
  }, [id])

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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const res = await fetch(`/api/lots/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, photoUrl: photoUrl || null }),
    })
    if (res.ok) { router.push(`/lots/${id}`); router.refresh() }
    else { const d = await res.json(); setError(d.error || 'Ошибка'); setSaving(false) }
  }

  if (loading) return <div className="min-h-screen bg-light"><Header /><div className="text-center text-warm-500 py-12">Загрузка...</div></div>

  return (
    <div className="min-h-screen bg-light">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <button onClick={() => router.back()} className="text-sm text-warm-500 hover:text-dark mb-4 transition-colors">← Назад</button>
        <div className="bg-white rounded-xl border border-warm-200 p-6">
          <h1 className="font-display text-xl font-bold mb-6">Редактировать лот</h1>
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">{error}</div>}
          <form onSubmit={handleSave} className="space-y-3">
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
            <div><label className="block text-xs text-warm-500 mb-1">Дескрипторы</label><input type="text" value={form.descriptors} onChange={(e) => setForm({ ...form, descriptors: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
            <div>
              <label className="block text-xs text-warm-500 mb-1">Фото упаковки</label>
              {cropFile ? (
                <ImageCropper file={cropFile} onCrop={handleCropped} onCancel={() => setCropFile(null)} />
              ) : (
                <>
                  {photoUrl && <img src={photoUrl} alt="Фото" className="h-32 rounded-lg object-cover mb-2" />}
                  <input type="file" accept="image/*" onChange={handlePhotoSelect}
                    className="w-full text-sm text-warm-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/15 file:text-dark hover:file:bg-primary/25" />
                  {uploading && <p className="text-xs text-warm-500 mt-1">Загрузка...</p>}
                </>
              )}
            </div>
            <button type="submit" disabled={saving}
              className="w-full py-3 bg-primary hover:bg-primary-dark disabled:opacity-50 text-dark font-semibold rounded-lg transition-colors">
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
