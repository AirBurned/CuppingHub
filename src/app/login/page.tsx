'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        router.push('/lots')
      } else {
        const data = await res.json()
        setError(data.error || 'Ошибка входа')
      }
    } catch {
      setError('Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-dark mb-2">
            Cupping<span className="text-primary"> Hub</span>
          </h1>
          <p className="text-warm-500 text-sm">Платформа командного каппинга для бариста</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-warm-200 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">Логин</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-warm-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              placeholder="username" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">Пароль</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-warm-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              placeholder="••••••" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-primary hover:bg-primary-dark disabled:opacity-50 text-dark font-semibold rounded-lg transition-colors">
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <div className="text-center mt-4">
          <a href="/landing.html" className="text-sm text-warm-500 hover:text-dark transition-colors">← На главную</a>
        </div>
      </div>
    </div>
  )
}
