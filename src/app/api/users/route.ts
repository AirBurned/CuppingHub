import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser, hashPassword } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, role: true, createdAt: true, _count: { select: { evaluations: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(users)
}

export async function POST(request: Request) {
  const currentUser = await getUser()
  if (!currentUser || currentUser.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Только администратор может создавать аккаунты' }, { status: 403 })
  const { username, password, name, role } = await request.json()
  if (!username || !password || !name) return NextResponse.json({ error: 'Заполните все обязательные поля' }, { status: 400 })
  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) return NextResponse.json({ error: 'Пользователь с таким логином уже существует' }, { status: 409 })
  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: { username, passwordHash, name, role: role || 'MEMBER' },
    select: { id: true, username: true, name: true, role: true, createdAt: true },
  })
  return NextResponse.json(user, { status: 201 })
}
