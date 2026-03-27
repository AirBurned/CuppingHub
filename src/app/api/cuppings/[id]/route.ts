import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

function isAdminRole(role: string) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getUser()

  const session = await prisma.cuppingSession.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      lots: {
        include: {
          lot: {
            include: {
              evaluations: { select: { totalScore: true, userId: true } },
              recipes: {
                where: { recipeType: 'OFFICIAL' },
                take: 1,
                include: { author: { select: { name: true } } },
              },
            },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!session) {
    return NextResponse.json({ error: 'Каппинг не найден' }, { status: 404 })
  }

  const result = {
    id: session.id,
    name: session.name,
    date: session.date,
    notes: session.notes,
    status: session.status,
    createdBy: session.createdBy.name,
    createdById: session.createdById,
    lots: session.lots.map((sl) => {
      const myEval = user ? sl.lot.evaluations.find((e) => e.userId === user.userId) : null
      return {
        id: sl.lot.id,
        sessionLotId: sl.id,
        name: sl.lot.name,
        country: sl.lot.country,
        roaster: sl.lot.roaster,
        processing: sl.lot.processing,
        photoUrl: sl.lot.photoUrl,
        hasEvaluated: !!myEval,
        evaluationsCount: sl.lot.evaluations.length,
        avgScore: sl.lot.evaluations.length > 0
          ? Math.round(sl.lot.evaluations.reduce((sum, e) => sum + (e.totalScore ?? 0), 0) / sl.lot.evaluations.length * 100) / 100
          : null,
        officialRecipe: sl.lot.recipes[0] || null,
      }
    }),
  }

  return NextResponse.json(result)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getUser()
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
  }

  const body = await request.json()

  // Add a single lot
  if (body.addLotId) {
    const existing = await prisma.cuppingSessionLot.findUnique({
      where: { sessionId_lotId: { sessionId: id, lotId: body.addLotId } },
    })
    if (!existing) {
      const maxOrder = await prisma.cuppingSessionLot.findFirst({
        where: { sessionId: id }, orderBy: { order: 'desc' }, select: { order: true },
      })
      await prisma.cuppingSessionLot.create({
        data: { sessionId: id, lotId: body.addLotId, order: (maxOrder?.order ?? -1) + 1 },
      })
    }
    return NextResponse.json({ ok: true })
  }

  // Remove a single lot
  if (body.removeLotId) {
    await prisma.cuppingSessionLot.deleteMany({
      where: { sessionId: id, lotId: body.removeLotId },
    })
    return NextResponse.json({ ok: true })
  }

  // Full update (name, date, notes, lotIds)
  const { name, date, notes, lotIds } = body

  if (lotIds !== undefined) {
    await prisma.cuppingSessionLot.deleteMany({ where: { sessionId: id } })
    if (lotIds.length > 0) {
      await prisma.cuppingSessionLot.createMany({
        data: lotIds.map((lotId: string, index: number) => ({
          sessionId: id, lotId, order: index,
        })),
      })
    }
  }

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (date !== undefined) data.date = new Date(date)
  if (notes !== undefined) data.notes = notes || null
  if (body.status !== undefined) data.status = body.status

  if (Object.keys(data).length > 0) {
    await prisma.cuppingSession.update({ where: { id }, data })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getUser()
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
  }

  await prisma.cuppingSessionLot.deleteMany({ where: { sessionId: id } })
  await prisma.cuppingSession.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
