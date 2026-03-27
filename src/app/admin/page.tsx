'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { roleLabels, isAdmin } from '@/lib/constants'

interface User { id: string; username: string; name: string; role: string; _count: { evaluations: number } }

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<{ userId: string; role: string } | null>(null)
  const [showUserForm, setShowUserForm] = useState(false)
  const [userForm, setUserForm] = useState({ username: '', password: '', name: '', role: 'MEMBER' })
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.ok ? r.json() : null).then((data) => {
      setCurrentUser(data)
      if (!data || !isAdmin(data.role)) { router.push('/lots'); return }
    })
    fetch('/api/users').then((r) => r.json()).then(setUsers)
  }, [router])

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault(); setError('')
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userForm) })
    if (res.ok) { const u = await res.json(); setUsers((p) => [...p, { ...u, _count: { evaluations: 0 } }]); setShowUserForm(false); setUserForm({ username: '', password: '', name: '', role: 'MEMBER' }) }
    else { const d = await res.json(); setError(d.error) }
  }

  async function handleToggleRole(user: User) {
    if (!isSuperAdmin) return
    const roles = ['MEMBER', 'ADMIN', 'SUPER_ADMIN']
    const currentIdx = roles.indexOf(user.role)
    const newRole = roles[(currentIdx + 1) % roles.length]
    const res = await fetch(`/api/users/${user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: newRole }) })
    if (res.ok) setUsers((p) => p.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)))
  }

  async function handleDeleteUser(userId: string) {
    if (!isSuperAdmin) return
    if (!confirm('Удалить пользователя? Все его оценки и комментарии будут удалены.')) return
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
    if (res.ok) setUsers((p) => p.filter((u) => u.id !== userId))
    else { const d = await res.json(); setError(d.error) }
  }

  return (
    <div className="min-h-screen bg-light">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="font-display text-2xl font-bold mb-6">Команда</h1>
        {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">{error}</div>}

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">Сотрудники ({users.length})</h2>
          {isSuperAdmin && (
            <button onClick={() => setShowUserForm(!showUserForm)} className="px-4 py-2 bg-primary hover:bg-primary-dark text-dark font-medium rounded-lg text-sm transition-colors">
              {showUserForm ? 'Отмена' : '+ Создать аккаунт'}
            </button>
          )}
        </div>

        {showUserForm && isSuperAdmin && (
          <form onSubmit={handleCreateUser} className="bg-white rounded-xl border border-warm-200 p-5 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-warm-500 mb-1">Логин *</label><input type="text" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" required /></div>
              <div><label className="block text-xs text-warm-500 mb-1">Пароль *</label><input type="text" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" required /></div>
              <div><label className="block text-xs text-warm-500 mb-1">Имя *</label><input type="text" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" required /></div>
              <div><label className="block text-xs text-warm-500 mb-1">Роль</label>
                <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="MEMBER">Бариста</option>
                  <option value="ADMIN">Шеф-бариста</option>
                  <option value="SUPER_ADMIN">Администратор</option>
                </select>
              </div>
            </div>
            <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-dark text-dark font-medium rounded-lg text-sm transition-colors">Создать аккаунт</button>
          </form>
        )}

        <div className="bg-white rounded-xl border border-warm-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-warm-200 bg-warm-100/50">
              <th className="text-left px-4 py-3 font-medium text-warm-700">Имя</th>
              <th className="text-left px-4 py-3 font-medium text-warm-700">Логин</th>
              <th className="text-center px-4 py-3 font-medium text-warm-700">Роль</th>
              <th className="text-center px-4 py-3 font-medium text-warm-700">Оценок</th>
              {isSuperAdmin && <th className="text-right px-4 py-3 font-medium text-warm-700">Действия</th>}
            </tr></thead>
            <tbody>{users.map((u) => (
              <tr key={u.id} className="border-b border-warm-100 last:border-0">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-warm-500">{u.username}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    u.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-700' :
                    u.role === 'ADMIN' ? 'bg-primary/20 text-dark' : 'bg-warm-100 text-warm-700'
                  }`}>
                    {roleLabels[u.role] || u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-warm-500">{u._count.evaluations}</td>
                {isSuperAdmin && (
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleToggleRole(u)} className="text-xs text-warm-500 hover:text-dark transition-colors mr-3">Сменить роль</button>
                    <button onClick={() => handleDeleteUser(u.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Удалить</button>
                  </td>
                )}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
