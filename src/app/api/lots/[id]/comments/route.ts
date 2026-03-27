import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  const { text } = await request.json()
  if (!text?.trim()) return NextResponse.json({ error: 'Комментарий не может быть пустым' }, { status: 400 })
  const comment = await prisma.comment.create({
    data: { lotId: id, userId: user.userId, text: text.trim() },
    include: { user: { select: { name: true } } },
  })
  return NextResponse.json(comment, { status: 201 })
}
