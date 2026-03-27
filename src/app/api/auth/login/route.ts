import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signJWT, comparePassword } from '@/lib/auth'

export async function POST(request: Request) {
  const { username, password } = await request.json()
  if (!username || !password) {
    return NextResponse.json({ error: 'Введите логин и пароль' }, { status: 400 })
  }
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 })
  }
  const valid = await comparePassword(password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 })
  }
  const token = await signJWT({ userId: user.id, username: user.username, role: user.role, name: user.name })
  const response = NextResponse.json({ user: { id: user.id, username: user.username, name: user.name, role: user.role } })
  response.cookies.set('token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' })
  return response
}
