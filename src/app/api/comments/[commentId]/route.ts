import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const comment = await prisma.comment.findUnique({ where: { id: commentId } })
  if (!comment) return NextResponse.json({ error: 'Комментарий не найден' }, { status: 404 })
  if (comment.userId !== user.userId && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
  }

  const { text } = await request.json()
  if (!text?.trim()) return NextResponse.json({ error: 'Текст не может быть пустым' }, { status: 400 })

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { text: text.trim() },
    include: { user: { select: { name: true } } },
  })
  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const comment = await prisma.comment.findUnique({ where: { id: commentId } })
  if (!comment) return NextResponse.json({ error: 'Комментарий не найден' }, { status: 404 })
  if (comment.userId !== user.userId && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
  }

  await prisma.comment.delete({ where: { id: commentId } })
  return NextResponse.json({ ok: true })
}
