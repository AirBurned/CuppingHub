import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const evaluations = await prisma.evaluation.findMany({
    where: { lotId: id },
    include: { user: { select: { name: true, username: true } } },
    orderBy: { createdAt: 'asc' },
  })

  const myEvaluation = evaluations.find((e) => e.userId === user.userId)
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'

  return NextResponse.json({ evaluations, myEvaluation, locked: false, isAdmin })
}
