'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { isAdmin, roleLabels } from '@/lib/constants'

interface User {
  userId: string
  username: string
  name: string
  role: string
}

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .catch(() => null)
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/landing.html')
  }

  const navLinks = [
    { href: '/lots', label: 'Лоты' },
    { href: '/cuppings', label: 'Каппинг' },
    ...(user && isAdmin(user.role) ? [{ href: '/admin', label: 'Команда' }] : []),
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-warm-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/lots" className="font-display text-xl font-semibold text-dark">
            Cupping<span className="text-primary"> Hub</span>
          </Link>
          <nav className="flex gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'bg-primary/15 text-dark'
                    : 'text-warm-700 hover:bg-warm-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm text-warm-700">
              {user.name}
              {isAdmin(user.role) && (
                <span className="ml-1.5 text-xs bg-primary/20 text-dark px-1.5 py-0.5 rounded-full font-medium">
                  {roleLabels[user.role] || user.role}
                </span>
              )}
            </span>
          )}
          <button onClick={handleLogout} className="text-sm text-warm-500 hover:text-dark transition-colors">
            Выйти
          </button>
        </div>
      </div>
    </header>
  )
}
