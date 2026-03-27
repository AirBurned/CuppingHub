import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

export async function GET() {
  const sessions = await prisma.cuppingSession.findMany({
    include: {
      createdBy: { select: { name: true } },
      lots: {
        include: {
          lot: {
            select: {
              id: true, name: true, country: true, roaster: true,
              processing: true, photoUrl: true,
              evaluations: { select: { totalScore: true, userId: true } },
            },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { date: 'desc' },
  })

  const result = sessions.map((s) => ({
    id: s.id,
    name: s.name,
    date: s.date,
    notes: s.notes,
    status: s.status,
    createdBy: s.createdBy.name,
    lotsCount: s.lots.length,
    lots: s.lots.map((sl) => ({
      id: sl.lot.id,
      name: sl.lot.name,
      country: sl.lot.country,
      roaster: sl.lot.roaster,
      processing: sl.lot.processing,
      photoUrl: sl.lot.photoUrl,
      evaluationsCount: sl.lot.evaluations.length,
      avgScore: sl.lot.evaluations.length > 0
        ? Math.round(sl.lot.evaluations.reduce((sum, e) => sum + (e.totalScore ?? 0), 0) / sl.lot.evaluations.length * 100) / 100
        : null,
    })),
  }))

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
  }

  const { name, date, notes, lotIds } = await request.json()

  if (!name || !date) {
    return NextResponse.json({ error: 'Укажите название и дату' }, { status: 400 })
  }

  const session = await prisma.cuppingSession.create({
    data: {
      name,
      date: new Date(date),
      notes: notes || null,
      createdById: user.userId,
      lots: lotIds?.length ? {
        create: lotIds.map((lotId: string, index: number) => ({
          lotId,
          order: index,
        })),
      } : undefined,
    },
    include: {
      createdBy: { select: { name: true } },
      lots: { include: { lot: { select: { id: true, name: true } } } },
    },
  })

  return NextResponse.json(session, { status: 201 })
}
