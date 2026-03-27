'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import SpiderGraph from '@/components/SpiderGraph'
import { processingLabels, roastLevelLabels, brewMethodLabels, isAdmin } from '@/lib/constants'

interface Recipe { id: string; brewMethod: string; recipeType: string; dose: number | null; yield: number | null; waterAmount: number | null; ratio: string | null; grind: string | null; temperature: number | null; brewTime: string | null; notes: string | null; author: { name: string }; authorId: string }
interface Comment { id: string; text: string; createdAt: string; userId: string; user: { name: string } }
interface EvalData { user: { name: string }; aromaGround: number | null; aromaBrewed: number | null; flavor: number | null; aftertaste: number | null; acidity: number | null; body: number | null; sweetness: number | null; cleanCup: number | null; overall: number | null; defectScore: number | null; defectComment: string | null; descriptors: string | null; totalScore: number | null; [key: string]: unknown }
interface LotDetail { id: string; name: string; country: string; roaster: string; farm: string | null; variety: string | null; processing: string; customProcessing: string | null; roastLevel: string; roastDate: string | null; altitude: string | null; descriptors: string | null; photoUrl: string | null; status: string; avgScore: number | null; evaluationsCount: number; hasEvaluated: boolean; recipes: Recipe[]; comments: Comment[] }

export default function LotDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [lot, setLot] = useState<LotDetail | null>(null)
  const [comment, setComment] = useState('')
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [currentUser, setCurrentUser] = useState<{ userId: string; role: string } | null>(null)
  const [showRecipeForm, setShowRecipeForm] = useState(false)
  const [recipe, setRecipe] = useState({ brewMethod: 'V60', dose: '', yield: '', waterAmount: '', ratio: '', grind: '', temperature: '', brewTime: '', notes: '', customMethod: '' })
  const [editingRecipe, setEditingRecipe] = useState<string | null>(null)
  const [editRecipe, setEditRecipe] = useState({ brewMethod: 'V60', dose: '', yield: '', waterAmount: '', ratio: '', grind: '', temperature: '', brewTime: '', notes: '', customMethod: '' })
  const [evaluations, setEvaluations] = useState<EvalData[]>([])
  const [archiving, setArchiving] = useState(false)
  const [recipeTab, setRecipeTab] = useState('ALL')

  useEffect(() => {
    fetch(`/api/lots/${id}`).then((res) => res.ok ? res.json() : null).then((data) => data && setLot(data))
    fetch('/api/auth/me').then((r) => r.ok ? r.json() : null).then(setCurrentUser)
    fetch(`/api/lots/${id}/scores`).then((r) => r.ok ? r.json() : null).then((data) => data && setEvaluations(data.evaluations || []))
  }, [id])

  const userIsAdmin = currentUser && isAdmin(currentUser.role)

  async function handleDeleteMyEvaluation() {
    if (!confirm('Удалить вашу оценку этого лота?')) return
    const res = await fetch(`/api/lots/${id}/evaluate`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    if (res.ok) {
      setLot((p) => p ? { ...p, hasEvaluated: false, evaluationsCount: p.evaluationsCount - 1 } : p)
      setEvaluations((prev) => prev.filter((e) => {
        const evalUserId = (e as unknown as { userId?: string }).userId
        return evalUserId !== currentUser?.userId
      }))
    }
  }

  async function handleArchive() {
    if (!confirm('Переместить лот в архив?')) return
    setArchiving(true)
    const res = await fetch(`/api/lots/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'ARCHIVED' }) })
    if (res.ok) router.push('/lots')
    setArchiving(false)
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!comment.trim()) return
    const res = await fetch(`/api/lots/${id}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: comment }) })
    if (res.ok) { const nc = await res.json(); setLot((p) => p ? { ...p, comments: [nc, ...p.comments] } : p); setComment('') }
  }

  async function handleEditComment(commentId: string) {
    if (!editText.trim()) return
    const res = await fetch(`/api/comments/${commentId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: editText }) })
    if (res.ok) { const updated = await res.json(); setLot((p) => p ? { ...p, comments: p.comments.map((c) => c.id === commentId ? { ...c, text: updated.text } : c) } : p); setEditingComment(null) }
  }

  async function handleDeleteComment(commentId: string) {
    const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
    if (res.ok) { setLot((p) => p ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p) }
  }

  async function handleRecipe(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch(`/api/lots/${id}/recipes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(recipe) })
    if (res.ok) { const nr = await res.json(); setLot((p) => p ? { ...p, recipes: [...p.recipes, nr] } : p); setShowRecipeForm(false); setRecipe({ brewMethod: 'V60', dose: '', yield: '', waterAmount: '', ratio: '', grind: '', temperature: '', brewTime: '', notes: '', customMethod: '' }) }
  }

  async function handleEditRecipe(recipeId: string) {
    const res = await fetch(`/api/recipes/${recipeId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editRecipe) })
    if (res.ok) {
      const updated = await res.json()
      setLot((p) => p ? { ...p, recipes: p.recipes.map((r) => r.id === recipeId ? { ...r, ...updated } : r) } : p)
      setEditingRecipe(null)
    }
  }

  async function handleDeleteRecipe(recipeId: string) {
    if (!confirm('Удалить рецепт?')) return
    const res = await fetch(`/api/recipes/${recipeId}`, { method: 'DELETE' })
    if (res.ok) { setLot((p) => p ? { ...p, recipes: p.recipes.filter((r) => r.id !== recipeId) } : p) }
  }

  async function handleToggleOfficial(recipeId: string, currentType: string) {
    const newType = currentType === 'OFFICIAL' ? 'UNOFFICIAL' : 'OFFICIAL'
    const res = await fetch(`/api/recipes/${recipeId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipeType: newType }) })
    if (res.ok) {
      setLot((p) => p ? { ...p, recipes: p.recipes.map((r) => r.id === recipeId ? { ...r, recipeType: newType } : r) } : p)
    }
  }

  if (!lot) return <div className="min-h-screen bg-light"><Header /><div className="text-center text-warm-500 py-12">Загрузка...</div></div>

  // Filter recipes by tab
  const filteredRecipes = lot.recipes
    .filter((r) => recipeTab === 'ALL' || r.brewMethod === recipeTab)
    .sort((a, b) => {
      if (a.recipeType === 'OFFICIAL' && b.recipeType !== 'OFFICIAL') return -1
      if (a.recipeType !== 'OFFICIAL' && b.recipeType === 'OFFICIAL') return 1
      return 0
    })

  // Get unique brew methods for tabs
  const brewMethods = [...new Set(lot.recipes.map((r) => r.brewMethod))]

  // Auto-calculate ratio
  function calcRatio(dose: string, water: string, yieldVal: string, isEspresso: boolean): string {
    const d = parseFloat(dose)
    const w = parseFloat(isEspresso ? yieldVal : water)
    if (!d || !w || d <= 0) return ''
    return `1:${(w / d).toFixed(1)}`
  }

  function updateRecipeField(setter: (v: typeof recipe) => void, current: typeof recipe, field: string, value: string) {
    const updated = { ...current, [field]: value }
    const isEsp = updated.brewMethod === 'ESPRESSO'
    if (['dose', 'waterAmount', 'yield'].includes(field)) {
      updated.ratio = calcRatio(updated.dose, updated.waterAmount, updated.yield, isEsp)
    }
    setter(updated)
  }

  const inp = "w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"

  return (
    <div className="min-h-screen bg-light">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <button onClick={() => router.back()} className="text-sm text-warm-500 hover:text-dark mb-4 transition-colors">← Назад</button>

        {/* Lot info card with mini spider-graph overlay */}
        <div className="bg-white rounded-xl border border-warm-200 overflow-hidden mb-6">
          {lot.photoUrl && (
            <div className="h-48 sm:h-64 overflow-hidden relative">
              <img src={lot.photoUrl} alt={lot.name} className="w-full h-full object-cover" />
              {/* Mini spider-graph overlay — click to evaluate */}
              {evaluations.length > 0 && (
                <Link href={`/lots/${id}/scores`}
                  className="absolute bottom-2 right-2 w-28 h-28 bg-white/85 backdrop-blur-sm rounded-lg p-1 border border-warm-200/50 hover:border-primary/50 transition-colors cursor-pointer">
                  <SpiderGraph evaluations={evaluations} compact />
                </Link>
              )}
            </div>
          )}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="font-display text-2xl font-bold">{lot.name}</h1>
              <div className="flex items-center gap-2">
                {lot.avgScore && <span className="bg-primary/15 text-dark text-lg font-bold px-3 py-1 rounded-lg">{lot.avgScore.toFixed(2)}</span>}
                {lot.status === 'ARCHIVED' && <span className="text-xs bg-warm-200 text-warm-700 px-2 py-0.5 rounded-full">Архив</span>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div><span className="text-warm-500">Страна и регион:</span><p className="font-medium">{lot.country}</p></div>
              <div><span className="text-warm-500">Обжарщик:</span><p className="font-medium">{lot.roaster}</p></div>
              {lot.farm && <div><span className="text-warm-500">Ферма:</span><p className="font-medium">{lot.farm}</p></div>}
              {lot.variety && <div><span className="text-warm-500">Разновидность:</span><p className="font-medium">{lot.variety}</p></div>}
              <div><span className="text-warm-500">Обработка:</span><p className="font-medium">{lot.processing === 'OTHER' && lot.customProcessing ? lot.customProcessing : processingLabels[lot.processing] || lot.processing}</p></div>
              <div><span className="text-warm-500">Обжарка:</span><p className="font-medium">{roastLevelLabels[lot.roastLevel] || lot.roastLevel}</p></div>
              {lot.roastDate && <div><span className="text-warm-500">Дата обжарки:</span><p className="font-medium">{new Date(lot.roastDate).toLocaleDateString('ru')}</p></div>}
              {lot.altitude && <div><span className="text-warm-500">Высота:</span><p className="font-medium">{lot.altitude} м</p></div>}
            </div>
            {lot.descriptors && <p className="text-sm italic text-secondary mb-4">{lot.descriptors}</p>}

            {/* Action buttons - all on one level */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Link href={`/lots/${id}/evaluate`} className="px-4 py-2 bg-primary hover:bg-primary-dark text-dark font-semibold rounded-lg transition-colors text-sm">
                {lot.hasEvaluated ? 'Изменить оценку' : 'Оценить'}
              </Link>
              {lot.hasEvaluated && (
                <>
                  <Link href={`/lots/${id}/scores`} className="px-4 py-2 bg-dark text-white font-semibold rounded-lg hover:bg-warm-900 transition-colors text-sm">
                    Оценки ({lot.evaluationsCount})
                  </Link>
                  <button onClick={handleDeleteMyEvaluation}
                    className="px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 font-medium rounded-lg transition-colors text-sm">
                    Удалить мою оценку
                  </button>
                </>
              )}
              {userIsAdmin && (
                <>
                  <Link href={`/lots/${id}/edit`} className="px-4 py-2 border border-warm-300 text-warm-700 hover:bg-warm-100 font-medium rounded-lg transition-colors text-sm">
                    Редактировать
                  </Link>
                  {lot.status === 'ACTIVE' && (
                    <button onClick={handleArchive} disabled={archiving}
                      className="px-4 py-2 border border-warm-300 text-warm-700 hover:bg-warm-100 font-medium rounded-lg transition-colors text-sm">
                      {archiving ? '...' : 'В архив'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Full Spider Graph (if evaluated and no photo, or as expandable) */}
        {evaluations.length > 0 && !lot.photoUrl && (
          <div className="bg-white rounded-xl border border-warm-200 p-6 mb-6">
            <h2 className="font-display text-lg font-semibold mb-4">Паутинная диаграмма</h2>
            <SpiderGraph evaluations={evaluations} />
          </div>
        )}

        {/* Defects separately */}
        {evaluations.some((e) => e.defectScore !== null) && (
          <div className="bg-white rounded-xl border border-warm-200 p-5 mb-6">
            <h3 className="text-sm font-semibold mb-3">Дефекты</h3>
            <div className="space-y-2">
              {evaluations.filter((e) => e.defectScore !== null).map((e, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-warm-700">{e.user.name}</span>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${(e.defectScore ?? 10) < 5 ? 'text-red-500' : 'text-green-600'}`}>{e.defectScore?.toFixed(1)}</span>
                    {e.defectComment && <span className="text-xs text-warm-500 max-w-xs truncate">{e.defectComment}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recipes with tabs */}
        <div className="bg-white rounded-xl border border-warm-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Рецепты</h2>
            <button onClick={() => setShowRecipeForm(!showRecipeForm)} className="text-sm text-primary font-medium hover:text-primary-dark">{showRecipeForm ? 'Отмена' : '+ Добавить'}</button>
          </div>

          {/* Recipe tabs */}
          {lot.recipes.length > 0 && (
            <div className="flex gap-1 mb-4 bg-warm-100 p-1 rounded-lg overflow-x-auto">
              <button onClick={() => setRecipeTab('ALL')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${recipeTab === 'ALL' ? 'bg-white text-dark shadow-sm' : 'text-warm-500 hover:text-dark'}`}>
                Все ({lot.recipes.length})
              </button>
              {brewMethods.map((m) => (
                <button key={m} onClick={() => setRecipeTab(m)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${recipeTab === m ? 'bg-white text-dark shadow-sm' : 'text-warm-500 hover:text-dark'}`}>
                  {brewMethodLabels[m] || m} ({lot.recipes.filter((r) => r.brewMethod === m).length})
                </button>
              ))}
            </div>
          )}

          {showRecipeForm && (
            <form onSubmit={handleRecipe} className="border border-warm-200 rounded-lg p-4 mb-4 space-y-3">
              {/* Recipe form fields - inline to avoid remount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-warm-500 mb-1">Метод</label>
                  <select value={recipe.brewMethod} onChange={(e) => updateRecipeField(setRecipe, recipe, 'brewMethod', e.target.value)} className={inp}>
                    {Object.entries(brewMethodLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  {recipe.brewMethod === 'OTHER' && <input type="text" value={recipe.customMethod} onChange={(e) => updateRecipeField(setRecipe, recipe, 'customMethod', e.target.value)} placeholder="Какой метод?" className={`${inp} mt-1 border-primary/40 bg-primary/5`} />}
                </div>
                <div><label className="block text-xs text-warm-500 mb-1">Доза кофе (г)</label><input type="number" step="0.1" value={recipe.dose} onChange={(e) => updateRecipeField(setRecipe, recipe, 'dose', e.target.value)} className={inp} /></div>
                {recipe.brewMethod === 'ESPRESSO' ? (
                  <div><label className="block text-xs text-warm-500 mb-1">Выход (мл)</label><input type="number" step="0.1" value={recipe.yield} onChange={(e) => updateRecipeField(setRecipe, recipe, 'yield', e.target.value)} className={inp} /></div>
                ) : (
                  <div><label className="block text-xs text-warm-500 mb-1">Количество воды (мл)</label><input type="number" step="1" value={recipe.waterAmount} onChange={(e) => updateRecipeField(setRecipe, recipe, 'waterAmount', e.target.value)} className={inp} /></div>
                )}
                <div><label className="block text-xs text-warm-500 mb-1">Соотношение</label><input type="text" value={recipe.ratio} readOnly placeholder="авто" className={`${inp} bg-warm-100/50`} /></div>
                <div><label className="block text-xs text-warm-500 mb-1">Помол</label><input type="text" value={recipe.grind} onChange={(e) => updateRecipeField(setRecipe, recipe, 'grind', e.target.value)} className={inp} /></div>
                <div><label className="block text-xs text-warm-500 mb-1">Температура (°C)</label><input type="number" value={recipe.temperature} onChange={(e) => updateRecipeField(setRecipe, recipe, 'temperature', e.target.value)} className={inp} /></div>
                <div><label className="block text-xs text-warm-500 mb-1">Время экстракции</label><input type="text" value={recipe.brewTime} onChange={(e) => updateRecipeField(setRecipe, recipe, 'brewTime', e.target.value)} placeholder="3:30" className={inp} /></div>
              </div>
              <div><label className="block text-xs text-warm-500 mb-1">Примечания</label><textarea value={recipe.notes} onChange={(e) => setRecipe({ ...recipe, notes: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" /></div>
              <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-dark text-dark font-medium rounded-lg text-sm transition-colors">Сохранить рецепт</button>
            </form>
          )}

          {filteredRecipes.length === 0 && !showRecipeForm ? <p className="text-sm text-warm-500">Рецептов пока нет</p> : (
            <div className="space-y-3">
              {filteredRecipes.map((r) => {
                const canEditRecipe = userIsAdmin || (currentUser && r.authorId === currentUser.userId)
                return (
                  <div key={r.id} className={`border rounded-lg p-4 ${r.recipeType === 'OFFICIAL' ? 'border-primary/40 bg-primary/5' : 'border-warm-200'}`}>
                    {editingRecipe === r.id ? (
                      <div className="space-y-3">
                        {/* Edit recipe form fields - inline */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-warm-500 mb-1">Метод</label>
                            <select value={editRecipe.brewMethod} onChange={(e) => updateRecipeField(setEditRecipe, editRecipe, 'brewMethod', e.target.value)} className={inp}>
                              {Object.entries(brewMethodLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                          </div>
                          <div><label className="block text-xs text-warm-500 mb-1">Доза кофе (г)</label><input type="number" step="0.1" value={editRecipe.dose} onChange={(e) => updateRecipeField(setEditRecipe, editRecipe, 'dose', e.target.value)} className={inp} /></div>
                          {editRecipe.brewMethod === 'ESPRESSO' ? (
                            <div><label className="block text-xs text-warm-500 mb-1">Выход (мл)</label><input type="number" step="0.1" value={editRecipe.yield} onChange={(e) => updateRecipeField(setEditRecipe, editRecipe, 'yield', e.target.value)} className={inp} /></div>
                          ) : (
                            <div><label className="block text-xs text-warm-500 mb-1">Кол-во воды (мл)</label><input type="number" step="1" value={editRecipe.waterAmount} onChange={(e) => updateRecipeField(setEditRecipe, editRecipe, 'waterAmount', e.target.value)} className={inp} /></div>
                          )}
                          <div><label className="block text-xs text-warm-500 mb-1">Соотношение</label><input type="text" value={editRecipe.ratio} readOnly className={`${inp} bg-warm-100/50`} /></div>
                          <div><label className="block text-xs text-warm-500 mb-1">Помол</label><input type="text" value={editRecipe.grind} onChange={(e) => updateRecipeField(setEditRecipe, editRecipe, 'grind', e.target.value)} className={inp} /></div>
                          <div><label className="block text-xs text-warm-500 mb-1">Температура</label><input type="number" value={editRecipe.temperature} onChange={(e) => updateRecipeField(setEditRecipe, editRecipe, 'temperature', e.target.value)} className={inp} /></div>
                          <div><label className="block text-xs text-warm-500 mb-1">Время</label><input type="text" value={editRecipe.brewTime} onChange={(e) => updateRecipeField(setEditRecipe, editRecipe, 'brewTime', e.target.value)} placeholder="3:30" className={inp} /></div>
                        </div>
                        <div><label className="block text-xs text-warm-500 mb-1">Примечания</label><textarea value={editRecipe.notes} onChange={(e) => setEditRecipe({ ...editRecipe, notes: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" /></div>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditRecipe(r.id)} className="px-3 py-1.5 bg-primary text-dark rounded-lg text-xs font-medium">Сохранить</button>
                          <button onClick={() => setEditingRecipe(null)} className="px-3 py-1.5 bg-warm-100 text-warm-700 rounded-lg text-xs">Отмена</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-medium text-sm">{brewMethodLabels[r.brewMethod] || r.brewMethod}</span>
                          {r.recipeType === 'OFFICIAL' && <span className="text-xs bg-primary/20 text-dark px-1.5 py-0.5 rounded-full font-medium">официальный</span>}
                          <span className="text-xs text-warm-500 ml-auto">{r.author.name}</span>
                          {canEditRecipe && (
                            <div className="flex gap-2">
                              {userIsAdmin && (
                                <button onClick={() => handleToggleOfficial(r.id, r.recipeType)}
                                  className={`text-xs font-medium ${r.recipeType === 'OFFICIAL' ? 'text-warm-500 hover:text-dark' : 'text-primary hover:text-primary-dark'}`}>
                                  {r.recipeType === 'OFFICIAL' ? 'Снять статус' : 'Сделать офиц.'}
                                </button>
                              )}
                              <button onClick={() => {
                                setEditingRecipe(r.id)
                                setEditRecipe({
                                  brewMethod: r.brewMethod, dose: r.dose?.toString() || '', yield: r.yield?.toString() || '',
                                  waterAmount: r.waterAmount?.toString() || '', ratio: r.ratio || '', grind: r.grind || '',
                                  temperature: r.temperature?.toString() || '', brewTime: r.brewTime || '', notes: r.notes || '', customMethod: '',
                                })
                              }} className="text-xs text-primary hover:text-primary-dark font-medium">Изменить</button>
                              <button onClick={() => handleDeleteRecipe(r.id)} className="text-xs text-red-400 hover:text-red-600">Удалить</button>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-warm-700">
                          {r.dose && <span>Доза: {r.dose}г</span>}
                          {r.yield && <span>Выход: {r.yield}мл</span>}
                          {r.waterAmount && <span>Вода: {r.waterAmount}мл</span>}
                          {r.ratio && <span>Соотношение: {r.ratio}</span>}
                          {r.grind && <span>Помол: {r.grind}</span>}{r.temperature && <span>Темп: {r.temperature}°C</span>}{r.brewTime && <span>Время: {r.brewTime}</span>}
                        </div>
                        {r.notes && <p className="text-xs text-warm-500 mt-2 italic">{r.notes}</p>}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="bg-white rounded-xl border border-warm-200 p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Комментарии</h2>
          <form onSubmit={handleComment} className="flex gap-2 mb-4">
            <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Написать комментарий..."
              className="flex-1 px-4 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <button type="submit" className="px-4 py-2 bg-dark text-white rounded-lg text-sm font-medium hover:bg-warm-900 transition-colors">Отправить</button>
          </form>
          {lot.comments.length === 0 ? <p className="text-sm text-warm-500">Комментариев пока нет</p> : (
            <div className="space-y-3">
              {lot.comments.map((c) => {
                const canEdit = currentUser && (c.userId === currentUser.userId || isAdmin(currentUser.role))
                return (
                  <div key={c.id} className="border-b border-warm-100 pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{c.user.name}</span>
                        <span className="text-xs text-warm-500">{new Date(c.createdAt).toLocaleDateString('ru')}</span>
                      </div>
                      {canEdit && editingComment !== c.id && (
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingComment(c.id); setEditText(c.text) }} className="text-xs text-warm-500 hover:text-dark">Изменить</button>
                          <button onClick={() => handleDeleteComment(c.id)} className="text-xs text-red-400 hover:text-red-600">Удалить</button>
                        </div>
                      )}
                    </div>
                    {editingComment === c.id ? (
                      <div className="flex gap-2 mt-1">
                        <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        <button onClick={() => handleEditComment(c.id)} className="px-3 py-1.5 bg-primary text-dark rounded-lg text-xs font-medium">Сохранить</button>
                        <button onClick={() => setEditingComment(null)} className="px-3 py-1.5 bg-warm-100 text-warm-700 rounded-lg text-xs">Отмена</button>
                      </div>
                    ) : (
                      <p className="text-sm text-warm-700">{c.text}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
