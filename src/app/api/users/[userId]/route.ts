import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const currentUser = await getUser()
  if (!currentUser || currentUser.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
  const { role } = await request.json()
  if (!['SUPER_ADMIN', 'ADMIN', 'MEMBER'].includes(role)) return NextResponse.json({ error: 'Неверная роль' }, { status: 400 })
  const user = await prisma.user.update({ where: { id: userId }, data: { role }, select: { id: true, username: true, name: true, role: true } })
  return NextResponse.json(user)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const currentUser = await getUser()
  if (!currentUser || currentUser.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
  if (currentUser.userId === userId) return NextResponse.json({ error: 'Нельзя удалить себя' }, { status: 400 })

  await prisma.comment.deleteMany({ where: { userId } })
  await prisma.evaluation.deleteMany({ where: { userId } })
  await prisma.recipe.deleteMany({ where: { authorId: userId } })
  await prisma.cuppingSession.deleteMany({ where: { createdById: userId } })
  await prisma.user.delete({ where: { id: userId } })
  return NextResponse.json({ ok: true })
}
